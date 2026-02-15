using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp.AspNetCore.Mvc;
using Volo.Abp.Domain.Repositories;
using MecanicApp.Entities;
using Volo.Abp.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;

namespace MecanicApp.Controllers
{
    [Route("api/ordenes-servicio")]
    public class OrdenServicioController : AbpController
    {
        private readonly IRepository<OrdenServicio, Guid> _ordenServicioRepository;
        private readonly IRepository<Vehiculo, Guid> _vehiculoRepository;
        private readonly IRepository<Servicio, Guid> _servicioRepository;
        private readonly IRepository<Producto, Guid> _productoRepository;
        private readonly IRepository<OrdenServicioDetalle, Guid> _detalleRepository;

        private readonly IRepository<OrdenServicioUsuario, Guid> _ordenServicioUsuarioRepository;
        private readonly IIdentityUserRepository _userRepository;

        private readonly IRepository<Cliente, Guid> _clienteRepository;
        private readonly ILogger<OrdenServicioController> _logger;

        public OrdenServicioController(
            IRepository<OrdenServicio, Guid> ordenServicioRepository,
            IRepository<Vehiculo, Guid> vehiculoRepository,
            IRepository<Servicio, Guid> servicioRepository,
            IRepository<Producto, Guid> productoRepository,
            IRepository<OrdenServicioDetalle, Guid> detalleRepository,
            IRepository<OrdenServicioUsuario, Guid> ordenServicioUsuarioRepository,
    IRepository<Cliente, Guid> clienteRepository,
    IIdentityUserRepository userRepository,
    ILogger<OrdenServicioController> logger)
        {
            _ordenServicioRepository = ordenServicioRepository;
            _vehiculoRepository = vehiculoRepository;
            _servicioRepository = servicioRepository;
            _productoRepository = productoRepository;
            _detalleRepository = detalleRepository;
            _ordenServicioUsuarioRepository = ordenServicioUsuarioRepository;
            _clienteRepository = clienteRepository;        // ← AGREGAR
            _userRepository = userRepository;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<List<OrdenServicioDto>>> GetAll()
        {
            try
            {
                var ordenes = await _ordenServicioRepository.GetListAsync();

                if (!ordenes.Any())
                    return Ok(new { success = true, data = new List<OrdenServicioDto>() });

                var ordenIds = ordenes.Select(o => o.Id).ToList();
                var vehiculoIds = ordenes.Select(o => o.VehiculoId).Distinct().ToList();

                // 1. Obtener detalles de órdenes
                var todosDetalles = await _detalleRepository.GetListAsync(d => ordenIds.Contains(d.OrdenServicioId));
                var detallesPorOrden = todosDetalles
                    .GroupBy(d => d.OrdenServicioId)
                    .ToDictionary(g => g.Key, g => g.ToList());

                // 2. Obtener vehículos
                var vehiculos = await _vehiculoRepository.GetListAsync(v => vehiculoIds.Contains(v.Id));

                // 3. Obtener clientes (necesario para ClienteNombre)
                var clienteIds = vehiculos.Where(v => v.ClienteId != Guid.Empty).Select(v => v.ClienteId).Distinct().ToList(); var clientes = clienteIds.Any()
                    ? await _clienteRepository.GetListAsync(c => clienteIds.Contains(c.Id))
                    : new List<Cliente>();

                // 4. OBTENER USUARIOS ASIGNADOS (¡ESTO ES LO NUEVO!)
                var usuariosAsignados = await _ordenServicioUsuarioRepository.GetListAsync(u => ordenIds.Contains(u.OrdenServicioId));
                var usuariosPorOrden = usuariosAsignados
                    .GroupBy(u => u.OrdenServicioId)
                    .ToDictionary(g => g.Key, g => g.ToList());

                // 5. Obtener información de usuarios de Identity
                var userIds = usuariosAsignados.Select(u => u.UsuarioId).Distinct().ToList();
                var identityUsers = await _userRepository.GetListAsync();
                var usuariosDic = identityUsers.ToDictionary(u => u.Id, u => new
                {
                    u.Name,
                    u.Surname,
                    u.UserName,
                    u.Email
                });

                var dtos = new List<OrdenServicioDto>();
                foreach (var orden in ordenes)
                {
                    var vehiculo = vehiculos.FirstOrDefault(v => v.Id == orden.VehiculoId);
                    var cliente = vehiculo != null && vehiculo.ClienteId != Guid.Empty
    ? clientes.FirstOrDefault(c => c.Id == vehiculo.ClienteId)
    : null;

                    // Obtener usuarios asignados para esta orden específica
                    var usuariosDeEstaOrden = usuariosPorOrden.ContainsKey(orden.Id)
                        ? usuariosPorOrden[orden.Id]
                        : new List<OrdenServicioUsuario>();

                    var dto = new OrdenServicioDto
                    {
                        Id = orden.Id,
                        Codigo = orden.Codigo,
                        VehiculoId = orden.VehiculoId,
                        PlacaVehiculo = vehiculo?.Placa ?? string.Empty,
                        ClienteId = vehiculo?.ClienteId,
                        ClienteNombre = cliente != null
                            ? $"{cliente.Nombre} "
                            : string.Empty,
                        FechaEntrada = orden.FechaEntrada,
                        FechaSalida = orden.FechaSalida,
                        Estado = orden.Estado,
                        Observaciones = orden.Observaciones,
                        SubtotalServicios = orden.SubtotalServicios,
                        SubtotalProductos = orden.SubtotalProductos,
                        Descuento = orden.Descuento,
                        Impuesto = orden.Impuesto,
                        Total = orden.Total,
                        DuracionTotalEstimada = orden.DuracionTotalEstimada,
                        Detalles = detallesPorOrden.ContainsKey(orden.Id)
                            ? detallesPorOrden[orden.Id].Select(d => new OrdenServicioDetalleDto
                            {
                                Id = d.Id,
                                ServicioId = d.ServicioId,
                                ProductoId = d.ProductoId,
                                Tipo = d.Tipo,
                                Descripcion = d.Descripcion,
                                Cantidad = d.Cantidad,
                                PrecioUnitario = d.PrecioUnitario,
                                Subtotal = d.Subtotal,
                                Observaciones = d.Observaciones,
                            }).ToList()
                            : new List<OrdenServicioDetalleDto>(),
                        // 6. AGREGAR USUARIOS ASIGNADOS AL DTO
                        UsuariosAsignados = usuariosDeEstaOrden.Select(u =>
                        {
                            var identityUser = usuariosDic.ContainsKey(u.UsuarioId) ? usuariosDic[u.UsuarioId] : null;

                            return new OrdenServicioUsuarioDto
                            {
                                Id = u.Id,
                                OrdenServicioId = u.OrdenServicioId,
                                UsuarioId = u.UsuarioId,
                                UsuarioNombre = !string.IsNullOrEmpty(u.NombreCompleto)
                                    ? u.NombreCompleto
                                    : $"{identityUser?.Name ?? ""} {identityUser?.Surname ?? ""}".Trim(),
                                UsuarioUserName = !string.IsNullOrEmpty(u.UserName)
                                    ? u.UserName
                                    : identityUser?.UserName ?? u.UsuarioId.ToString(),
                                Rol = u.Rol,
                                Estado = u.Estado,
                                FechaAsignacion = u.FechaAsignacion,
                                FechaCompletado = u.FechaCompletado,
                                Observaciones = u.Observaciones
                            };
                        }).ToList(),
                        CreationTime = orden.CreationTime
                    };

                    dtos.Add(dto);
                }

                return Ok(new { success = true, data = dtos });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener todas las órdenes");
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpGet("usuarios-disponibles")]
        public async Task<ActionResult> GetUsuariosDisponibles([FromQuery] Guid? ordenId = null)
        {
            try
            {
                _logger.LogWarning("========== VERSIÓN SIMPLIFICADA ==========");

                // 1. TODOS los usuarios
                var todosUsuarios = await _userRepository.GetListAsync();

                // 2. TODAS las asignaciones con estado ASIGNADO de MECÁNICOS Y LAVADORES
                var asignaciones = await _ordenServicioUsuarioRepository
                    .GetListAsync(u => u.Estado == "ASIGNADO"
                        && (u.Rol == "Mecánico" || u.Rol == "Lavador"));

                _logger.LogWarning($"Asignaciones activas encontradas: {asignaciones.Count}");

                // 3. IDs de usuarios ocupados
                var usuariosOcupados = asignaciones
                    .Select(u => u.UsuarioId)
                    .Distinct()
                    .ToList();

                _logger.LogWarning($"Usuarios ocupados: {usuariosOcupados.Count}");

                // 4. Filtrar disponibles
                var disponibles = todosUsuarios
                    .Where(u => !usuariosOcupados.Contains(u.Id))
                    .Select(u => new { u.Id, u.UserName, u.Name, u.Surname, u.Email, u.PhoneNumber })
                    .ToList();

                return Ok(new { success = true, data = disponibles, totalCount = disponibles.Count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error");
                return BadRequest(new { success = false, error = ex.Message });
            }
        }
        [HttpGet("{id}")]
        public async Task<ActionResult<OrdenServicioDto>> Get(Guid id)
        {
            try
            {
                var orden = await _ordenServicioRepository.GetAsync(id);
                var detalles = await _detalleRepository.GetListAsync(d => d.OrdenServicioId == id);
                var vehiculo = await _vehiculoRepository.GetAsync(orden.VehiculoId);
                var usuariosAsignados = await _ordenServicioUsuarioRepository
                    .GetListAsync(u => u.OrdenServicioId == id);

                // Obtener información de usuarios
                var usuariosDto = new List<OrdenServicioUsuarioDto>();
                foreach (var usuarioAsignado in usuariosAsignados)
                {
                    var usuario = await _userRepository.FindAsync(usuarioAsignado.UsuarioId);
                    usuariosDto.Add(new OrdenServicioUsuarioDto
                    {
                        Id = usuarioAsignado.Id,
                        OrdenServicioId = usuarioAsignado.OrdenServicioId,
                        UsuarioId = usuarioAsignado.UsuarioId,
                        UsuarioNombre = $"{usuario?.Name} {usuario?.Surname}".Trim(),
                        UsuarioUserName = usuario?.UserName ?? "N/A",
                        Rol = usuarioAsignado.Rol,
                        Estado = usuarioAsignado.Estado,
                        FechaAsignacion = usuarioAsignado.FechaAsignacion,
                        FechaCompletado = usuarioAsignado.FechaCompletado,
                        Observaciones = usuarioAsignado.Observaciones
                    });
                }

                return Ok(new
                {
                    success = true,
                    data = new OrdenServicioDto
                    {
                        Id = orden.Id,
                        Codigo = orden.Codigo,
                        VehiculoId = orden.VehiculoId,
                        PlacaVehiculo = vehiculo?.Placa ?? string.Empty,
                        ClienteId = vehiculo?.ClienteId,
                        ClienteNombre = "", // Deberías cargar el cliente aquí también
                        FechaEntrada = orden.FechaEntrada,
                        FechaSalida = orden.FechaSalida,
                        Estado = orden.Estado,
                        Observaciones = orden.Observaciones,
                        SubtotalServicios = orden.SubtotalServicios,
                        SubtotalProductos = orden.SubtotalProductos,
                        Descuento = orden.Descuento,
                        Impuesto = orden.Impuesto,
                        Total = orden.Total,

                        // ✅ ¡AGREGAR ESTA LÍNEA!
                        DuracionTotalEstimada = orden.DuracionTotalEstimada,

                        Detalles = detalles.Select(d => new OrdenServicioDetalleDto
                        {
                            Id = d.Id,
                            ServicioId = d.ServicioId,
                            ProductoId = d.ProductoId,
                            Tipo = d.Tipo,
                            Descripcion = d.Descripcion,
                            Cantidad = d.Cantidad,
                            PrecioUnitario = d.PrecioUnitario,
                            Subtotal = d.Subtotal,
                            Observaciones = d.Observaciones
                        }).ToList(),

                        UsuariosAsignados = usuariosDto,
                        CreationTime = orden.CreationTime
                    }
                });
            }
            catch (Exception)
            {
                return NotFound(new { success = false, error = "Orden no encontrada" });
            }
        }
        [HttpGet("vehiculo/{vehiculoId}")]
        public async Task<ActionResult<List<OrdenServicioDto>>> GetByVehiculo(Guid vehiculoId)
        {
            try
            {
                var ordenes = await _ordenServicioRepository.GetListAsync(o => o.VehiculoId == vehiculoId);

                if (!ordenes.Any())
                    return Ok(new { success = true, data = new List<OrdenServicioDto>() });

                var ordenIds = ordenes.Select(o => o.Id).ToList();

                var todosDetalles = await _detalleRepository.GetListAsync(d => ordenIds.Contains(d.OrdenServicioId));
                var detallesPorOrden = todosDetalles
                    .GroupBy(d => d.OrdenServicioId)
                    .ToDictionary(g => g.Key, g => g.ToList());

                var vehiculo = await _vehiculoRepository.GetAsync(vehiculoId);

                var dtos = new List<OrdenServicioDto>();
                foreach (var orden in ordenes)
                {
                    var dto = new OrdenServicioDto
                    {
                        Id = orden.Id,
                        Codigo = orden.Codigo,
                        VehiculoId = orden.VehiculoId,
                        PlacaVehiculo = vehiculo?.Placa ?? string.Empty,
                        ClienteId = vehiculo?.ClienteId,
                        ClienteNombre = "",
                        FechaEntrada = orden.FechaEntrada,
                        FechaSalida = orden.FechaSalida,
                        Estado = orden.Estado,
                        Observaciones = orden.Observaciones,
                        SubtotalServicios = orden.SubtotalServicios,
                        SubtotalProductos = orden.SubtotalProductos,
                        Descuento = orden.Descuento,
                        Impuesto = orden.Impuesto,
                        Total = orden.Total,
                        DuracionTotalEstimada = orden.DuracionTotalEstimada,
                        Detalles = detallesPorOrden.ContainsKey(orden.Id)
                            ? detallesPorOrden[orden.Id].Select(d => new OrdenServicioDetalleDto
                            {
                                Id = d.Id,
                                ServicioId = d.ServicioId,
                                ProductoId = d.ProductoId,
                                Tipo = d.Tipo,
                                Descripcion = d.Descripcion,
                                Cantidad = d.Cantidad,
                                PrecioUnitario = d.PrecioUnitario,
                                Subtotal = d.Subtotal,
                                Observaciones = d.Observaciones
                            }).ToList()
                            : new List<OrdenServicioDetalleDto>(),
                        CreationTime = orden.CreationTime
                    };

                    dtos.Add(dto);
                }

                return Ok(new { success = true, data = dtos });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpGet("estado/{estado}")]
        public async Task<ActionResult<List<OrdenServicioDto>>> GetByEstado(string estado)
        {
            try
            {
                var ordenes = await _ordenServicioRepository.GetListAsync(o => o.Estado == estado);

                if (!ordenes.Any())
                    return Ok(new { success = true, data = new List<OrdenServicioDto>() });

                var ordenIds = ordenes.Select(o => o.Id).ToList();
                var vehiculoIds = ordenes.Select(o => o.VehiculoId).Distinct().ToList();

                var todosDetalles = await _detalleRepository.GetListAsync(d => ordenIds.Contains(d.OrdenServicioId));
                var detallesPorOrden = todosDetalles
                    .GroupBy(d => d.OrdenServicioId)
                    .ToDictionary(g => g.Key, g => g.ToList());

                var vehiculos = await _vehiculoRepository.GetListAsync(v => vehiculoIds.Contains(v.Id));

                var dtos = new List<OrdenServicioDto>();
                foreach (var orden in ordenes)
                {
                    var vehiculo = vehiculos.FirstOrDefault(v => v.Id == orden.VehiculoId);

                    var dto = new OrdenServicioDto
                    {
                        Id = orden.Id,
                        Codigo = orden.Codigo,
                        VehiculoId = orden.VehiculoId,
                        PlacaVehiculo = vehiculo?.Placa ?? string.Empty,
                        ClienteId = vehiculo?.ClienteId,
                        ClienteNombre = "",
                        FechaEntrada = orden.FechaEntrada,
                        FechaSalida = orden.FechaSalida,
                        Estado = orden.Estado,
                        Observaciones = orden.Observaciones,
                        SubtotalServicios = orden.SubtotalServicios,
                        SubtotalProductos = orden.SubtotalProductos,
                        Descuento = orden.Descuento,
                        Impuesto = orden.Impuesto,
                        Total = orden.Total,
                        DuracionTotalEstimada = orden.DuracionTotalEstimada,
                        Detalles = detallesPorOrden.ContainsKey(orden.Id)
                            ? detallesPorOrden[orden.Id].Select(d => new OrdenServicioDetalleDto
                            {
                                Id = d.Id,
                                ServicioId = d.ServicioId,
                                ProductoId = d.ProductoId,
                                Tipo = d.Tipo,
                                Descripcion = d.Descripcion,
                                Cantidad = d.Cantidad,
                                PrecioUnitario = d.PrecioUnitario,
                                Subtotal = d.Subtotal,
                                Observaciones = d.Observaciones
                            }).ToList()
                            : new List<OrdenServicioDetalleDto>(),
                        CreationTime = orden.CreationTime
                    };

                    dtos.Add(dto);
                }

                return Ok(new { success = true, data = dtos });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<OrdenServicioDto>> Create([FromBody] CreateOrdenServicioDto input)
        {
            try
            {
                var vehiculo = await _vehiculoRepository.GetAsync(input.VehiculoId);

                // Generar código único
                var hoy = DateTime.Now;
                var prefijo = $"ORD-{hoy:yyyyMMdd}-";
                var ultimaOrden = (await _ordenServicioRepository.GetListAsync())
                    .Where(o => o.Codigo.StartsWith(prefijo))
                    .OrderByDescending(o => o.Codigo)
                    .FirstOrDefault();

                var codigo = ultimaOrden == null
                    ? prefijo + "001"
                    : prefijo + (int.Parse(ultimaOrden.Codigo.Substring(prefijo.Length)) + 1).ToString("D3");

                // 1. CREAR ORDEN
                var orden = new OrdenServicio(codigo, input.VehiculoId)
                {
                    Observaciones = input.Observaciones,
                    Estado = input.Estado ?? "COTIZACION",
                    DuracionTotalEstimada = 0
                };

                orden = await _ordenServicioRepository.InsertAsync(orden, autoSave: true);

                _logger.LogWarning($"🆕 Orden creada: {orden.Codigo} - ID: {orden.Id}");

                // 2. CALCULAR DURACIÓN MANUALMENTE
                int duracionTotalCalculada = 0;

                if (input.Detalles != null && input.Detalles.Any())
                {
                    foreach (var detalleDto in input.Detalles.Where(d => d.ServicioId.HasValue))
                    {
                        var servicio = await _servicioRepository.GetAsync(detalleDto.ServicioId.Value);
                        duracionTotalCalculada += (servicio.DuracionEstimada ?? 0) * detalleDto.Cantidad;

                        _logger.LogWarning($"⏱️ Servicio: {servicio.Nombre}, Duración: {servicio.DuracionEstimada} min, Cantidad: {detalleDto.Cantidad}, Subtotal: {servicio.DuracionEstimada * detalleDto.Cantidad}");
                    }

                    _logger.LogWarning($"📊 DURACIÓN TOTAL CALCULADA: {duracionTotalCalculada} minutos");

                    // 3. 🔥🔥🔥 SQL DIRECTO - ÚNICA FORMA QUE GARANTIZA GUARDADO 🔥🔥🔥
                    var sql = "UPDATE [MecanicApp].[dbo].[OrdenesServicio] SET DuracionTotalEstimada = @p0 WHERE Id = @p1";
                    var result = await _ordenServicioRepository.GetDbContext().Database.ExecuteSqlRawAsync(
                        sql, duracionTotalCalculada, orden.Id);

                    _logger.LogWarning($"✅ SQL EXECUTE RESULT: {result} fila(s) actualizada(s)");


                    // 5. CREAR DETALLES
                    foreach (var detalleDto in input.Detalles)
                    {
                        var detalle = new OrdenServicioDetalle
                        {
                            OrdenServicioId = orden.Id,
                            ServicioId = detalleDto.ServicioId,
                            ProductoId = detalleDto.ProductoId,
                            Tipo = detalleDto.Tipo,
                            Descripcion = detalleDto.Descripcion,
                            Cantidad = detalleDto.Cantidad,
                            PrecioUnitario = detalleDto.PrecioUnitario,
                            Observaciones = detalleDto.Observaciones
                        };

                        detalle.CalcularSubtotal();
                        await _detalleRepository.InsertAsync(detalle, autoSave: true);
                    }

                    // 6. CALCULAR TOTALES ECONÓMICOS
                    var detallesActuales = await _detalleRepository.GetListAsync(d => d.OrdenServicioId == orden.Id);

                    decimal subtotalServicios = 0;
                    decimal subtotalProductos = 0;

                    foreach (var detalle in detallesActuales)
                    {
                        if (detalle.Tipo == "SERVICIO")
                            subtotalServicios += detalle.Subtotal;
                        else if (detalle.Tipo == "PRODUCTO")
                            subtotalProductos += detalle.Subtotal;
                    }

                    var subtotal = subtotalServicios + subtotalProductos;
                    var impuesto = subtotal * 0.12m;
                    var total = subtotal + impuesto;

                    // 7. ACTUALIZAR TOTALES ECONÓMICOS (TAMBIÉN CON SQL DIRECTO)
                    await _ordenServicioRepository.GetDbContext().Database.ExecuteSqlRawAsync(
                        @"UPDATE [MecanicApp].[dbo].[OrdenesServicio] 
                  SET SubtotalServicios = @p0, SubtotalProductos = @p1, Impuesto = @p2, Total = @p3 
                  WHERE Id = @p4",
                        subtotalServicios, subtotalProductos, impuesto, total, orden.Id);
                }

                // 8. ASIGNAR USUARIOS
                if (input.UsuariosAsignados != null && input.UsuariosAsignados.Any())
                {
                    foreach (var usuarioDto in input.UsuariosAsignados)
                    {
                        var usuario = await _userRepository.FindAsync(usuarioDto.UsuarioId);
                        if (usuario != null)
                        {
                            var asignacion = new OrdenServicioUsuario(orden.Id, usuarioDto.UsuarioId, usuarioDto.Rol)
                            {
                                Observaciones = usuarioDto.Observaciones
                            };

                            await _ordenServicioUsuarioRepository.InsertAsync(asignacion, autoSave: true);
                        }
                    }
                }


                return Ok(new
                {
                    success = true,
                    message = "Orden creada exitosamente",
                    data = await GetOrdenDto(orden.Id)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear orden");
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<OrdenServicioDto>> Update(Guid id, [FromBody] UpdateOrdenServicioDto input)
        {
            try
            {
                var orden = await _ordenServicioRepository.GetAsync(id);
                var detalles = await _detalleRepository.GetListAsync(d => d.OrdenServicioId == id);
                orden.Detalles = detalles;

                orden.Estado = input.Estado;
                orden.Observaciones = input.Observaciones;
                orden.Descuento = input.Descuento;

                if (input.FechaSalida.HasValue)
                    orden.FechaSalida = input.FechaSalida.Value;

                orden.CalcularTotalesYDuracion();
                orden = await _ordenServicioRepository.UpdateAsync(orden, autoSave: true);

                return Ok(new
                {
                    success = true,
                    message = "Orden actualizada exitosamente",
                    data = await GetOrdenDto(orden.Id)
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpPost("{id}/detalles")]
        public async Task<ActionResult<OrdenServicioDto>> AgregarDetalle(Guid id, [FromBody] AgregarDetalleDto input)
        {
            try
            {
                var orden = await _ordenServicioRepository.GetAsync(id);
                var detalles = await _detalleRepository.GetListAsync(d => d.OrdenServicioId == id);
                orden.Detalles = detalles;

                var detalle = new OrdenServicioDetalle
                {
                    OrdenServicioId = id,
                    ServicioId = input.ServicioId,
                    ProductoId = input.ProductoId,
                    Tipo = input.Tipo,
                    Descripcion = input.Descripcion,
                    Cantidad = input.Cantidad,
                    PrecioUnitario = input.PrecioUnitario,
                    Observaciones = input.Observaciones
                };

                detalle.CalcularSubtotal();
                await _detalleRepository.InsertAsync(detalle, autoSave: true);

                if (input.Tipo == "PRODUCTO" && input.ProductoId.HasValue)
                {
                    var producto = await _productoRepository.GetAsync(input.ProductoId.Value);
                    if (producto.Stock < input.Cantidad)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            error = $"Stock insuficiente. Disponible: {producto.Stock}"
                        });
                    }

                    if (orden.Estado == "APROBADA" || orden.Estado == "EN_PROGRESO")
                    {
                        producto.Stock -= input.Cantidad;
                        await _productoRepository.UpdateAsync(producto, autoSave: true);
                    }
                }

                orden.Detalles.Add(detalle);
                orden.CalcularTotalesYDuracion();
                orden = await _ordenServicioRepository.UpdateAsync(orden, autoSave: true);

                return Ok(new
                {
                    success = true,
                    message = "Detalle agregado exitosamente",
                    data = await GetOrdenDto(orden.Id)
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpDelete("{id}/detalles/{detalleId}")]
        public async Task<ActionResult<OrdenServicioDto>> RemoverDetalle(Guid id, Guid detalleId)
        {
            try
            {
                var orden = await _ordenServicioRepository.GetAsync(id);
                var detalles = await _detalleRepository.GetListAsync(d => d.OrdenServicioId == id);
                var detalle = detalles.FirstOrDefault(d => d.Id == detalleId);

                if (detalle == null)
                    return NotFound(new { success = false, error = "Detalle no encontrado" });

                if (detalle.Tipo == "PRODUCTO" && detalle.ProductoId.HasValue &&
                    (orden.Estado == "APROBADA" || orden.Estado == "EN_PROGRESO"))
                {
                    var producto = await _productoRepository.GetAsync(detalle.ProductoId.Value);
                    producto.Stock += detalle.Cantidad;
                    await _productoRepository.UpdateAsync(producto, autoSave: true);
                }

                await _detalleRepository.DeleteAsync(detalleId, autoSave: true);

                orden.Detalles = detalles.Where(d => d.Id != detalleId).ToList();
                orden.CalcularTotalesYDuracion();
                orden = await _ordenServicioRepository.UpdateAsync(orden, autoSave: true);

                return Ok(new
                {
                    success = true,
                    message = "Detalle removido exitosamente",
                    data = await GetOrdenDto(orden.Id)
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpPost("{id}/cambiar-estado/{estado}")]
        public async Task<ActionResult<OrdenServicioDto>> CambiarEstado(Guid id, string estado)
        {
            try
            {
                var orden = await _ordenServicioRepository.GetAsync(id);
                var detalles = await _detalleRepository.GetListAsync(d => d.OrdenServicioId == id);
                orden.Detalles = detalles;

                var estadoAnterior = orden.Estado;
                orden.Estado = estado;

                if (estado == "COMPLETADA" || estado == "FACTURADA")
                {
                    orden.FechaSalida = DateTime.Now;
                    _logger.LogWarning($"📅 FechaSalida asignada: {orden.FechaSalida} para orden {orden.Codigo}");
                }

                if ((estadoAnterior == "COTIZACION" && estado == "APROBADA") ||
                    (estadoAnterior == "COTIZACION" && estado == "EN_PROGRESO"))
                {
                    foreach (var detalle in orden.Detalles.Where(d => d.Tipo == "PRODUCTO"))
                    {
                        if (detalle.ProductoId.HasValue)
                        {
                            var producto = await _productoRepository.GetAsync(detalle.ProductoId.Value);
                            if (producto.Stock < detalle.Cantidad)
                            {
                                return BadRequest(new
                                {
                                    success = false,
                                    error = $"Stock insuficiente para {producto.Nombre}. Disponible: {producto.Stock}"
                                });
                            }

                            producto.Stock -= detalle.Cantidad;
                            await _productoRepository.UpdateAsync(producto, autoSave: true);
                        }
                    }
                }

                if ((estadoAnterior == "APROBADA" || estadoAnterior == "EN_PROGRESO") && estado == "CANCELADA")
                {
                    foreach (var detalle in orden.Detalles.Where(d => d.Tipo == "PRODUCTO"))
                    {
                        if (detalle.ProductoId.HasValue)
                        {
                            var producto = await _productoRepository.GetAsync(detalle.ProductoId.Value);
                            producto.Stock += detalle.Cantidad;
                            await _productoRepository.UpdateAsync(producto, autoSave: true);
                        }
                    }
                }

                orden = await _ordenServicioRepository.UpdateAsync(orden, autoSave: true);

                return Ok(new
                {
                    success = true,
                    message = $"Estado cambiado a {estado} exitosamente",
                    data = await GetOrdenDto(orden.Id)
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                var orden = await _ordenServicioRepository.GetAsync(id);

                if (orden.Estado != "COTIZACION" && orden.Estado != "CANCELADA")
                {
                    return BadRequest(new
                    {
                        success = false,
                        error = "No se puede eliminar una orden en estado " + orden.Estado
                    });
                }

                await _ordenServicioRepository.DeleteAsync(id, autoSave: true);
                return Ok(new { success = true, message = "Orden eliminada exitosamente" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpGet("{id}/usuarios-asignados")]
        public async Task<ActionResult<List<OrdenServicioUsuarioDto>>> GetUsuariosAsignados(Guid id)
        {
            try
            {
                var asignaciones = await _ordenServicioUsuarioRepository
                    .GetListAsync(x => x.OrdenServicioId == id);

                var dtos = new List<OrdenServicioUsuarioDto>();

                foreach (var asignacion in asignaciones)
                {
                    var usuario = await _userRepository.FindAsync(asignacion.UsuarioId);

                    var dto = new OrdenServicioUsuarioDto
                    {
                        Id = asignacion.Id,
                        OrdenServicioId = asignacion.OrdenServicioId,
                        UsuarioId = asignacion.UsuarioId,
                        UsuarioNombre = $"{usuario?.Name} {usuario?.Surname}".Trim(),
                        UsuarioUserName = usuario?.UserName ?? "N/A",
                        Rol = asignacion.Rol,
                        Estado = asignacion.Estado,
                        FechaAsignacion = asignacion.FechaAsignacion,
                        FechaCompletado = asignacion.FechaCompletado,
                        Observaciones = asignacion.Observaciones
                    };

                    dtos.Add(dto);
                }

                return Ok(new { success = true, data = dtos });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpPost("{id}/asignar-usuario")]
        public async Task<ActionResult<OrdenServicioUsuarioDto>> AsignarUsuario(
            Guid id,
            [FromBody] AsignarUsuarioDto input)
        {
            try
            {
                // Verificar que la orden existe
                var orden = await _ordenServicioRepository.GetAsync(id);
                if (orden == null)
                {
                    return NotFound(new { success = false, error = "Orden no encontrada" });
                }

                // Verificar que el usuario existe
                var usuario = await _userRepository.FindAsync(input.UsuarioId);
                if (usuario == null)
                {
                    return NotFound(new { success = false, error = "Usuario no encontrado" });
                }

                // Verificar si ya está asignado
                var yaAsignado = await _ordenServicioUsuarioRepository
                    .FirstOrDefaultAsync(x => x.OrdenServicioId == id && x.UsuarioId == input.UsuarioId);

                if (yaAsignado != null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        error = "Este usuario ya está asignado a la orden"
                    });
                }

                // Crear la asignación
                var asignacion = new OrdenServicioUsuario(id, input.UsuarioId, input.Rol)
                {
                    Observaciones = input.Observaciones
                };

                await _ordenServicioUsuarioRepository.InsertAsync(asignacion, autoSave: true);

                var dto = new OrdenServicioUsuarioDto
                {
                    Id = asignacion.Id,
                    OrdenServicioId = asignacion.OrdenServicioId,
                    UsuarioId = asignacion.UsuarioId,
                    UsuarioNombre = $"{usuario.Name} {usuario.Surname}".Trim(),
                    UsuarioUserName = usuario.UserName,
                    Rol = asignacion.Rol,
                    Estado = asignacion.Estado,
                    FechaAsignacion = asignacion.FechaAsignacion,
                    FechaCompletado = asignacion.FechaCompletado,
                    Observaciones = asignacion.Observaciones
                };

                return Ok(new
                {
                    success = true,
                    message = "Usuario asignado correctamente",
                    data = dto
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpPut("asignaciones/{asignacionId}")]
        public async Task<ActionResult<OrdenServicioUsuarioDto>> ActualizarAsignacion(
            Guid asignacionId,
            [FromBody] ActualizarAsignacionDto input)
        {
            try
            {
                var asignacion = await _ordenServicioUsuarioRepository.GetAsync(asignacionId);

                asignacion.Estado = input.Estado;
                asignacion.Observaciones = input.Observaciones;

                if (input.Estado == "COMPLETADO")
                {
                    asignacion.FechaCompletado = DateTime.Now;
                }

                await _ordenServicioUsuarioRepository.UpdateAsync(asignacion, autoSave: true);

                var usuario = await _userRepository.FindAsync(asignacion.UsuarioId);

                var dto = new OrdenServicioUsuarioDto
                {
                    Id = asignacion.Id,
                    OrdenServicioId = asignacion.OrdenServicioId,
                    UsuarioId = asignacion.UsuarioId,
                    UsuarioNombre = $"{usuario?.Name} {usuario?.Surname}".Trim(),
                    UsuarioUserName = usuario?.UserName ?? "N/A",
                    Rol = asignacion.Rol,
                    Estado = asignacion.Estado,
                    FechaAsignacion = asignacion.FechaAsignacion,
                    FechaCompletado = asignacion.FechaCompletado,
                    Observaciones = asignacion.Observaciones
                };

                return Ok(new
                {
                    success = true,
                    message = "Asignación actualizada correctamente",
                    data = dto
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpDelete("asignaciones/{asignacionId}")]
        public async Task<IActionResult> RemoverAsignacion(Guid asignacionId)
        {
            try
            {
                await _ordenServicioUsuarioRepository.DeleteAsync(asignacionId, autoSave: true);
                return Ok(new
                {
                    success = true,
                    message = "Asignación removida correctamente"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        private async Task<OrdenServicioDto> GetOrdenDto(Guid id)
        {
            var orden = await _ordenServicioRepository.GetAsync(id);
            var detalles = await _detalleRepository.GetListAsync(d => d.OrdenServicioId == id);
            var vehiculo = await _vehiculoRepository.GetAsync(orden.VehiculoId);
            var usuariosAsignados = await _ordenServicioUsuarioRepository
                .GetListAsync(u => u.OrdenServicioId == id);

            // ✅ CARGAR SERVICIOS PARA LOS DETALLES
            var servicioIds = detalles
                .Where(d => d.ServicioId.HasValue)
                .Select(d => d.ServicioId.Value)
                .Distinct()
                .ToList();

            var servicios = servicioIds.Any()
                ? await _servicioRepository.GetListAsync(s => servicioIds.Contains(s.Id))
                : new List<Servicio>();

            // Obtener información de usuarios
            var usuariosDto = new List<OrdenServicioUsuarioDto>();
            foreach (var usuarioAsignado in usuariosAsignados)
            {
                var usuario = await _userRepository.FindAsync(usuarioAsignado.UsuarioId);
                usuariosDto.Add(new OrdenServicioUsuarioDto
                {
                    Id = usuarioAsignado.Id,
                    OrdenServicioId = usuarioAsignado.OrdenServicioId,
                    UsuarioId = usuarioAsignado.UsuarioId,
                    UsuarioNombre = $"{usuario?.Name} {usuario?.Surname}".Trim(),
                    UsuarioUserName = usuario?.UserName ?? "N/A",
                    Rol = usuarioAsignado.Rol,
                    Estado = usuarioAsignado.Estado,
                    FechaAsignacion = usuarioAsignado.FechaAsignacion,
                    FechaCompletado = usuarioAsignado.FechaCompletado,
                    Observaciones = usuarioAsignado.Observaciones
                });
            }

            return new OrdenServicioDto
            {
                Id = orden.Id,
                Codigo = orden.Codigo,
                VehiculoId = orden.VehiculoId,
                PlacaVehiculo = vehiculo?.Placa ?? string.Empty,
                ClienteId = vehiculo?.ClienteId,
                ClienteNombre = "",
                FechaEntrada = orden.FechaEntrada,
                FechaSalida = orden.FechaSalida,
                Estado = orden.Estado,
                Observaciones = orden.Observaciones,
                SubtotalServicios = orden.SubtotalServicios,
                SubtotalProductos = orden.SubtotalProductos,
                Descuento = orden.Descuento,
                Impuesto = orden.Impuesto,
                Total = orden.Total,
                DuracionTotalEstimada = orden.DuracionTotalEstimada, // ✅ NUEVO CAMPO
                Detalles = detalles.Select(d => new OrdenServicioDetalleDto
                {
                    Id = d.Id,
                    ServicioId = d.ServicioId,
                    ProductoId = d.ProductoId,
                    Tipo = d.Tipo,
                    Descripcion = d.Descripcion,
                    Cantidad = d.Cantidad,
                    PrecioUnitario = d.PrecioUnitario,
                    Subtotal = d.Subtotal,
                    Observaciones = d.Observaciones,
                }).ToList(),
                UsuariosAsignados = usuariosDto,
                CreationTime = orden.CreationTime
            };
        }
        // DTOs

        [HttpGet("reportes/ingresos")]
        public async Task<ActionResult> GetReporteIngresos(
            [FromQuery] DateTime? fechaInicio,
            [FromQuery] DateTime? fechaFin)
        {
            try
            {
                _logger.LogInformation("📊 Generando reporte de ingresos");

                var inicio = fechaInicio ?? DateTime.Today.AddDays(-30);
                var fin = fechaFin ?? DateTime.Today.AddDays(1);

                _logger.LogInformation($"📅 Período: {inicio:yyyy-MM-dd} a {fin:yyyy-MM-dd}");

                // Obtener órdenes COMPLETADAS o FACTURADAS en el período
                var ordenes = await _ordenServicioRepository
                    .GetListAsync(o => o.FechaSalida >= inicio && o.FechaSalida < fin
                        && (o.Estado == "COMPLETADA" || o.Estado == "FACTURADA"));

                _logger.LogInformation($"📊 Órdenes encontradas: {ordenes.Count}");

                // Agrupar por día
                var ingresosPorDia = ordenes
                    .Where(o => o.FechaSalida.HasValue)
                    .GroupBy(o => o.FechaSalida.Value.Date)
                    .Select(g => new
                    {
                        fecha = g.Key.ToString("yyyy-MM-dd"),
                        total = g.Sum(o => o.Total),
                        cantidad = g.Count()
                    })
                    .OrderBy(x => x.fecha)
                    .ToList();

                return Ok(new
                {
                    success = true,
                    data = ingresosPorDia,
                    total = ingresosPorDia.Sum(x => x.total),
                    cantidad = ingresosPorDia.Sum(x => x.cantidad)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error en reporte ingresos");
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpGet("reportes/servicios-mas-usados")]
        public async Task<ActionResult> GetServiciosMasUsados(
    [FromQuery] DateTime? fechaInicio,
    [FromQuery] DateTime? fechaFin,
    [FromQuery] int top = 10)
        {
            try
            {
                var inicio = fechaInicio ?? DateTime.Today.AddDays(-30);
                var fin = fechaFin ?? DateTime.Today.AddDays(1);

                _logger.LogInformation($"📊 Servicios - Período: {inicio:yyyy-MM-dd} a {fin:yyyy-MM-dd}");

                // Obtener TODOS los detalles de servicios del período
                var ordenes = await _ordenServicioRepository
                    .GetListAsync(o => o.FechaEntrada >= inicio && o.FechaEntrada < fin);

                var ordenIds = ordenes.Select(o => o.Id).ToList();

                if (!ordenIds.Any())
                {
                    return Ok(new { success = true, data = new List<object>() });
                }

                var detalles = await _detalleRepository
                    .GetListAsync(d => ordenIds.Contains(d.OrdenServicioId) && d.Tipo == "SERVICIO");

                _logger.LogInformation($"📊 Total detalles de servicios: {detalles.Count}");

                var servicioIds = detalles
                    .Where(d => d.ServicioId.HasValue)
                    .Select(d => d.ServicioId.Value)
                    .Distinct()
                    .ToList();

                var servicios = await _servicioRepository
                    .GetListAsync(s => servicioIds.Contains(s.Id));

                var serviciosDict = servicios.ToDictionary(s => s.Id);

                var resultado = detalles
                    .Where(d => d.ServicioId.HasValue)
                    .GroupBy(d => d.ServicioId.Value)
                    .Select(g =>
                    {
                        var servicio = serviciosDict.ContainsKey(g.Key) ? serviciosDict[g.Key] : null;
                        return new
                        {
                            nombre = servicio?.Nombre ?? "Desconocido",
                            cantidad = g.Sum(d => d.Cantidad),
                            total = g.Sum(d => d.Subtotal)
                        };
                    })
                    .OrderByDescending(x => x.cantidad)
                    .Take(top)
                    .ToList();

                _logger.LogInformation($"✅ Servicios encontrados: {resultado.Count}");

                return Ok(new { success = true, data = resultado });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error en reporte servicios");
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpGet("reportes/rendimiento-tecnicos")]
        public async Task<ActionResult> GetRendimientoTecnicos(
    [FromQuery] DateTime? fechaInicio,
    [FromQuery] DateTime? fechaFin)
        {
            try
            {
                _logger.LogInformation("📊 Generando reporte de rendimiento de técnicos");

                var inicio = fechaInicio ?? DateTime.Today.AddDays(-30);
                var fin = fechaFin ?? DateTime.Today.AddDays(1);

                _logger.LogInformation($"📅 Período: {inicio:yyyy-MM-dd} a {fin:yyyy-MM-dd}");

                // 1. Obtener órdenes COMPLETADAS/FACTURADAS del período
                var ordenes = await _ordenServicioRepository
                    .GetListAsync(o => o.FechaSalida >= inicio && o.FechaSalida < fin
                        && (o.Estado == "COMPLETADA" || o.Estado == "FACTURADA"));

                _logger.LogInformation($"📊 Órdenes completadas/facturadas: {ordenes.Count}");

                if (!ordenes.Any())
                {
                    return Ok(new { success = true, data = new List<object>() });
                }

                var ordenIds = ordenes.Select(o => o.Id).ToList();

                // 2. Obtener TODAS las asignaciones
                var asignaciones = await _ordenServicioUsuarioRepository
                    .GetListAsync(u => ordenIds.Contains(u.OrdenServicioId));

                _logger.LogInformation($"📊 Total asignaciones: {asignaciones.Count}");

                // 3. ✅ FILTRAR TÉCNICOS (case insensitive)
                var asignacionesTecnicos = asignaciones
                    .Where(u => u.Rol != null && (
                        u.Rol.ToLower().Contains("mecanico") ||   // Con acento o sin acento
                        u.Rol.ToLower().Contains("lavador")))
                    .ToList();

                _logger.LogInformation($"📊 Asignaciones de técnicos: {asignacionesTecnicos.Count}");

                if (!asignacionesTecnicos.Any())
                {
                    return Ok(new { success = true, data = new List<object>() });
                }

                // 4. Obtener usuarios
                var usuarios = await _userRepository.GetListAsync();
                var usuariosDict = usuarios.ToDictionary(u => u.Id);

                // 5. Agrupar por técnico
                var resultado = asignacionesTecnicos
                    .GroupBy(u => u.UsuarioId)
                    .Select(g =>
                    {
                        var usuario = usuariosDict.ContainsKey(g.Key) ? usuariosDict[g.Key] : null;
                        var ordenesDelTecnicoIds = g.Select(a => a.OrdenServicioId).Distinct().ToList();
                        var ordenesDelTecnico = ordenes.Where(o => ordenesDelTecnicoIds.Contains(o.Id)).ToList();

                        return new
                        {
                            tecnicoId = g.Key,
                            nombre = $"{usuario?.Name ?? ""} {usuario?.Surname ?? ""}".Trim() ?? "N/A",
                            ordenesCompletadas = ordenesDelTecnico.Count,
                            totalFacturado = ordenesDelTecnico.Sum(o => o.Total)
                        };
                    })
                    .OrderByDescending(x => x.ordenesCompletadas)
                    .ToList();

                _logger.LogInformation($"✅ Técnicos encontrados: {resultado.Count}");

                return Ok(new { success = true, data = resultado });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error en reporte técnicos");
                return BadRequest(new { success = false, error = ex.Message });
            }
        }
        public class OrdenServicioDto
        {
            public Guid Id { get; set; }
            public string Codigo { get; set; }
            public Guid VehiculoId { get; set; }
            public string PlacaVehiculo { get; set; }
            public Guid? ClienteId { get; set; }
            public string ClienteNombre { get; set; }
            public DateTime FechaEntrada { get; set; }
            public DateTime? FechaSalida { get; set; }
            public string Estado { get; set; }
            public string Observaciones { get; set; }
            public decimal SubtotalServicios { get; set; }
            public decimal SubtotalProductos { get; set; }
            public decimal Descuento { get; set; }
            public decimal Impuesto { get; set; }
            public decimal Total { get; set; }
            public int DuracionTotalEstimada { get; set; }
            public List<OrdenServicioDetalleDto> Detalles { get; set; }
            public List<OrdenServicioUsuarioDto> UsuariosAsignados { get; set; }
            public DateTime CreationTime { get; set; }

            public OrdenServicioDto()
            {
                Codigo = string.Empty;
                PlacaVehiculo = string.Empty;
                ClienteNombre = string.Empty;
                Estado = "COTIZACION";
                Observaciones = string.Empty;
                Detalles = new List<OrdenServicioDetalleDto>();
                UsuariosAsignados = new List<OrdenServicioUsuarioDto>();
            }
        }

        public class OrdenServicioDetalleDto
        {
            public Guid Id { get; set; }
            public Guid? ServicioId { get; set; }
            public Guid? ProductoId { get; set; }
            public string Tipo { get; set; }
            public string Descripcion { get; set; }
            public int Cantidad { get; set; }
            public decimal PrecioUnitario { get; set; }
            public decimal Subtotal { get; set; }
            public string Observaciones { get; set; }
            public int DuracionTotalEstimada { get; set; }

            public OrdenServicioDetalleDto()
            {
                Tipo = string.Empty;
                Descripcion = string.Empty;
                Observaciones = string.Empty;
            }
        }

        public class CreateOrdenServicioDto
        {
            public Guid VehiculoId { get; set; }
            public string Estado { get; set; }
            public string Observaciones { get; set; }
            public List<CreateDetalleDto> Detalles { get; set; }
            public int DuracionTotalEstimada { get; set; }

            // Nueva propiedad para usuarios asignados
            public List<UsuarioAsignacionDto> UsuariosAsignados { get; set; }

            public CreateOrdenServicioDto()
            {
                Estado = "COTIZACION";
                Observaciones = string.Empty;
                Detalles = new List<CreateDetalleDto>();
                UsuariosAsignados = new List<UsuarioAsignacionDto>();
            }
        }

        // Agrega esta clase DTO
        public class UsuarioAsignacionDto
        {
            public Guid UsuarioId { get; set; }
            public string Rol { get; set; }
            public string Observaciones { get; set; }

            public UsuarioAsignacionDto()
            {
                Rol = string.Empty;
                Observaciones = string.Empty;
            }
        }

        public class UpdateOrdenServicioDto
        {
            public string Estado { get; set; }
            public string Observaciones { get; set; }
            public decimal Descuento { get; set; }
            public DateTime? FechaSalida { get; set; }

            public UpdateOrdenServicioDto()
            {
                Estado = string.Empty;
                Observaciones = string.Empty;
            }
        }

        public class CreateDetalleDto
        {
            public Guid? ServicioId { get; set; }
            public Guid? ProductoId { get; set; }
            public string Tipo { get; set; }
            public string Descripcion { get; set; }
            public int Cantidad { get; set; }
            public decimal PrecioUnitario { get; set; }
            public string Observaciones { get; set; }

            public CreateDetalleDto()
            {
                Tipo = string.Empty;
                Descripcion = string.Empty;
                Observaciones = string.Empty;
            }
        }

        public class AgregarDetalleDto
        {
            public Guid? ServicioId { get; set; }
            public Guid? ProductoId { get; set; }
            public string Tipo { get; set; }
            public string Descripcion { get; set; }
            public int Cantidad { get; set; }
            public decimal PrecioUnitario { get; set; }
            public string Observaciones { get; set; }

            public AgregarDetalleDto()
            {
                Tipo = string.Empty;
                Descripcion = string.Empty;
                Observaciones = string.Empty;
            }
        }

        public class OrdenServicioUsuarioDto
        {
            public Guid Id { get; set; }
            public Guid OrdenServicioId { get; set; }
            public Guid UsuarioId { get; set; }
            public string UsuarioNombre { get; set; }
            public string UsuarioUserName { get; set; }
            public string Rol { get; set; }
            public string Estado { get; set; }
            public DateTime FechaAsignacion { get; set; }
            public DateTime? FechaCompletado { get; set; }
            public string Observaciones { get; set; }

            public OrdenServicioUsuarioDto()
            {
                UsuarioNombre = string.Empty;
                UsuarioUserName = string.Empty;
                Rol = string.Empty;
                Estado = "ASIGNADO";
                Observaciones = string.Empty;
            }
        }

        public class AsignarUsuarioDto
        {
            public Guid UsuarioId { get; set; }
            public string Rol { get; set; }
            public string Observaciones { get; set; }

            public AsignarUsuarioDto()
            {
                Rol = string.Empty;
                Observaciones = string.Empty;
            }
        }

        public class ActualizarAsignacionDto
        {
            public string Estado { get; set; }
            public string Observaciones { get; set; }

            public ActualizarAsignacionDto()
            {
                Estado = string.Empty;
                Observaciones = string.Empty;
            }
        }

    }
}