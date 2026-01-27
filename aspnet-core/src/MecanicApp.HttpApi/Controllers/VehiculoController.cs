using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp.AspNetCore.Mvc;
using Volo.Abp.Domain.Repositories;
using MecanicApp.Entities;

namespace MecanicApp.Controllers
{
    [Route("api/vehiculos")]
    public class VehiculoController : AbpController
    {
        private readonly IRepository<Vehiculo, Guid> _vehiculoRepository;
        private readonly IRepository<Cliente, Guid> _clienteRepository;

        public VehiculoController(
            IRepository<Vehiculo, Guid> vehiculoRepository,
            IRepository<Cliente, Guid> clienteRepository)
        {
            _vehiculoRepository = vehiculoRepository;
            _clienteRepository = clienteRepository;
        }

        [HttpGet]
        public async Task<ActionResult<List<VehiculoDto>>> GetAll()
        {
            try
            {
                var vehiculos = await _vehiculoRepository.GetListAsync(includeDetails: true);
                var dtos = new List<VehiculoDto>();

                foreach (var vehiculo in vehiculos)
                {
                    dtos.Add(new VehiculoDto
                    {
                        Id = vehiculo.Id,
                        Placa = vehiculo.Placa,
                        Marca = vehiculo.Marca,
                        Modelo = vehiculo.Modelo,
                        Anio = vehiculo.Anio,
                        Color = vehiculo.Color,
                        Kilometraje = vehiculo.Kilometraje,
                        ClienteId = vehiculo.ClienteId,
                        ClienteNombre = vehiculo.Cliente?.Nombre,
                        CreationTime = vehiculo.CreationTime
                    });
                }

                return Ok(new { success = true, data = dtos });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<VehiculoDto>> Get(Guid id)
        {
            try
            {
                var vehiculo = await _vehiculoRepository.GetAsync(id);

                return Ok(new
                {
                    success = true,
                    data = new VehiculoDto
                    {
                        Id = vehiculo.Id,
                        Placa = vehiculo.Placa,
                        Marca = vehiculo.Marca,
                        Modelo = vehiculo.Modelo,
                        Anio = vehiculo.Anio,
                        Color = vehiculo.Color,
                        Kilometraje = vehiculo.Kilometraje,
                        ClienteId = vehiculo.ClienteId,
                        ClienteNombre = vehiculo.Cliente?.Nombre,
                        CreationTime = vehiculo.CreationTime
                    }
                });
            }
            catch (Exception ex)
            {
                return NotFound(new { success = false, error = "Vehículo no encontrado", details = ex.Message });
            }
        }

        [HttpGet("cliente/{clienteId}")]
        public async Task<ActionResult<List<VehiculoDto>>> GetByCliente(Guid clienteId)
        {
            try
            {
                var vehiculos = await _vehiculoRepository.GetListAsync(v => v.ClienteId == clienteId);
                var dtos = new List<VehiculoDto>();

                foreach (var vehiculo in vehiculos)
                {
                    dtos.Add(new VehiculoDto
                    {
                        Id = vehiculo.Id,
                        Placa = vehiculo.Placa,
                        Marca = vehiculo.Marca,
                        Modelo = vehiculo.Modelo,
                        Anio = vehiculo.Anio,
                        Color = vehiculo.Color,
                        Kilometraje = vehiculo.Kilometraje,
                        ClienteId = vehiculo.ClienteId,
                        CreationTime = vehiculo.CreationTime
                    });
                }

                return Ok(new { success = true, data = dtos });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpGet("placa/{placa}")]
        public async Task<ActionResult<VehiculoDto>> GetByPlaca(string placa)
        {
            try
            {
                var vehiculo = await _vehiculoRepository.FirstOrDefaultAsync(v => v.Placa == placa);

                if (vehiculo == null)
                    return NotFound(new { success = false, error = $"Vehículo con placa {placa} no encontrado" });

                return Ok(new
                {
                    success = true,
                    data = new VehiculoDto
                    {
                        Id = vehiculo.Id,
                        Placa = vehiculo.Placa,
                        Marca = vehiculo.Marca,
                        Modelo = vehiculo.Modelo,
                        Anio = vehiculo.Anio,
                        Color = vehiculo.Color,
                        Kilometraje = vehiculo.Kilometraje,
                        ClienteId = vehiculo.ClienteId,
                        ClienteNombre = vehiculo.Cliente?.Nombre,
                        CreationTime = vehiculo.CreationTime
                    }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<VehiculoDto>> Create([FromBody] CreateVehiculoDto input)
        {
            try
            {
                // Verificar que el cliente existe
                var cliente = await _clienteRepository.GetAsync(input.ClienteId);

                var vehiculo = new Vehiculo(input.Placa, input.Marca, input.Modelo, input.ClienteId)
                {
                    Anio = input.Anio,
                    Color = input.Color,
                    Kilometraje = input.Kilometraje
                };

                vehiculo = await _vehiculoRepository.InsertAsync(vehiculo, autoSave: true);

                return Ok(new
                {
                    success = true,
                    message = "Vehículo creado exitosamente",
                    data = new VehiculoDto
                    {
                        Id = vehiculo.Id,
                        Placa = vehiculo.Placa,
                        Marca = vehiculo.Marca,
                        Modelo = vehiculo.Modelo,
                        Anio = vehiculo.Anio,
                        Color = vehiculo.Color,
                        Kilometraje = vehiculo.Kilometraje,
                        ClienteId = vehiculo.ClienteId,
                        ClienteNombre = cliente.Nombre,
                        CreationTime = vehiculo.CreationTime
                    }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<VehiculoDto>> Update(Guid id, [FromBody] UpdateVehiculoDto input)
        {
            try
            {
                var vehiculo = await _vehiculoRepository.GetAsync(id);

                vehiculo.Placa = input.Placa;
                vehiculo.Marca = input.Marca;
                vehiculo.Modelo = input.Modelo;
                vehiculo.Anio = input.Anio;
                vehiculo.Color = input.Color;
                vehiculo.Kilometraje = input.Kilometraje;
                vehiculo.ClienteId = input.ClienteId;

                vehiculo = await _vehiculoRepository.UpdateAsync(vehiculo, autoSave: true);

                // Obtener nombre del cliente
                var cliente = await _clienteRepository.GetAsync(input.ClienteId);

                return Ok(new
                {
                    success = true,
                    message = "Vehículo actualizado exitosamente",
                    data = new VehiculoDto
                    {
                        Id = vehiculo.Id,
                        Placa = vehiculo.Placa,
                        Marca = vehiculo.Marca,
                        Modelo = vehiculo.Modelo,
                        Anio = vehiculo.Anio,
                        Color = vehiculo.Color,
                        Kilometraje = vehiculo.Kilometraje,
                        ClienteId = vehiculo.ClienteId,
                        ClienteNombre = cliente.Nombre,
                        CreationTime = vehiculo.CreationTime
                    }
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
                await _vehiculoRepository.DeleteAsync(id, autoSave: true);
                return Ok(new { success = true, message = "Vehículo eliminado exitosamente" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }
    }

    public class VehiculoDto
    {
        public Guid Id { get; set; }
        public string Placa { get; set; }
        public string Marca { get; set; }
        public string Modelo { get; set; }
        public int? Anio { get; set; }
        public string Color { get; set; }
        public decimal? Kilometraje { get; set; }
        public Guid ClienteId { get; set; }
        public string ClienteNombre { get; set; }
        public DateTime CreationTime { get; set; }
    }

    public class CreateVehiculoDto
    {
        public string Placa { get; set; }
        public string Marca { get; set; }
        public string Modelo { get; set; }
        public int? Anio { get; set; }
        public string Color { get; set; }
        public decimal? Kilometraje { get; set; }
        public Guid ClienteId { get; set; }
    }

    public class UpdateVehiculoDto
    {
        public string Placa { get; set; }
        public string Marca { get; set; }
        public string Modelo { get; set; }
        public int? Anio { get; set; }
        public string Color { get; set; }
        public decimal? Kilometraje { get; set; }
        public Guid ClienteId { get; set; }
    }
}