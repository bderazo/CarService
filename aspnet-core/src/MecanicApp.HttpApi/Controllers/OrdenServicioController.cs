using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp.AspNetCore.Mvc;
using Volo.Abp.Domain.Repositories;
using MecanicApp.Entities;

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

        // ¡CONSTRUCTOR SIN DbContext!
        public OrdenServicioController(
            IRepository<OrdenServicio, Guid> ordenServicioRepository,
            IRepository<Vehiculo, Guid> vehiculoRepository,
            IRepository<Servicio, Guid> servicioRepository,
            IRepository<Producto, Guid> productoRepository,
            IRepository<OrdenServicioDetalle, Guid> detalleRepository)
        {
            _ordenServicioRepository = ordenServicioRepository;
            _vehiculoRepository = vehiculoRepository;
            _servicioRepository = servicioRepository;
            _productoRepository = productoRepository;
            _detalleRepository = detalleRepository;
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

        [HttpGet("{id}")]
        public async Task<ActionResult<OrdenServicioDto>> Get(Guid id)
        {
            try
            {
                var orden = await _ordenServicioRepository.GetAsync(id);
                var detalles = await _detalleRepository.GetListAsync(d => d.OrdenServicioId == id);
                var vehiculo = await _vehiculoRepository.GetAsync(orden.VehiculoId);

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
                        CreationTime = orden.CreationTime
                    }
                });
            }
            catch (Exception ex)
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

                // Generar código único (simplificado)
                var hoy = DateTime.Now;
                var prefijo = $"ORD-{hoy:yyyyMMdd}-";
                var ultimaOrden = (await _ordenServicioRepository.GetListAsync())
                    .Where(o => o.Codigo.StartsWith(prefijo))
                    .OrderByDescending(o => o.Codigo)
                    .FirstOrDefault();

                var codigo = ultimaOrden == null
                    ? prefijo + "001"
                    : prefijo + (int.Parse(ultimaOrden.Codigo.Substring(prefijo.Length)) + 1).ToString("D3");

                var orden = new OrdenServicio(codigo, input.VehiculoId)
                {
                    Observaciones = input.Observaciones,
                    Estado = input.Estado ?? "COTIZACION"
                };

                orden = await _ordenServicioRepository.InsertAsync(orden, autoSave: true);

                if (input.Detalles != null)
                {
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

                    // Recalcular totales
                    var detallesActuales = await _detalleRepository.GetListAsync(d => d.OrdenServicioId == orden.Id);
                    orden.Detalles = detallesActuales;
                    orden.CalcularTotales();
                    orden = await _ordenServicioRepository.UpdateAsync(orden, autoSave: true);
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

                orden.CalcularTotales();
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
                orden.CalcularTotales();
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
                orden.CalcularTotales();
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

        // Método auxiliar para obtener orden con detalles
        private async Task<OrdenServicioDto> GetOrdenDto(Guid id)
        {
            var orden = await _ordenServicioRepository.GetAsync(id);
            var detalles = await _detalleRepository.GetListAsync(d => d.OrdenServicioId == id);
            var vehiculo = await _vehiculoRepository.GetAsync(orden.VehiculoId);

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
                CreationTime = orden.CreationTime
            };
        }

        // DTOs
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
            public List<OrdenServicioDetalleDto> Detalles { get; set; }
            public DateTime CreationTime { get; set; }

            public OrdenServicioDto()
            {
                Codigo = string.Empty;
                PlacaVehiculo = string.Empty;
                ClienteNombre = string.Empty;
                Estado = "COTIZACION";
                Observaciones = string.Empty;
                Detalles = new List<OrdenServicioDetalleDto>();
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

            public CreateOrdenServicioDto()
            {
                Estado = "COTIZACION";
                Observaciones = string.Empty;
                Detalles = new List<CreateDetalleDto>();
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
    }
}