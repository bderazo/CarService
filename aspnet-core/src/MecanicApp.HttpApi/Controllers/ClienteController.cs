using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp.AspNetCore.Mvc;
using Volo.Abp.Domain.Repositories;
using MecanicApp.Entities; // <-- ESTE ES EL NAMESPACE CORRECTO

namespace MecanicApp.Controllers
{
    [Route("api/clientes")]
    public class ClienteController : AbpController
    {
        private readonly IRepository<Cliente, Guid> _clienteRepository;

        public ClienteController(IRepository<Cliente, Guid> clienteRepository)
        {
            _clienteRepository = clienteRepository;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateClienteDto input)
        {
            try
            {
                var cliente = new Cliente(input.Cedula, input.Nombre, input.Telefono)
                {
                    Email = input.Email,
                    Direccion = input.Direccion
                };

                cliente = await _clienteRepository.InsertAsync(cliente, autoSave: true);

                return Ok(new
                {
                    success = true,
                    id = cliente.Id,
                    message = "Cliente creado exitosamente",
                    data = new
                    {
                        cliente.Id,
                        cliente.Cedula,
                        cliente.Nombre,
                        cliente.Telefono,
                        cliente.Email,
                        cliente.Direccion,
                        cliente.CreationTime
                    }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var clientes = await _clienteRepository.GetListAsync();
                var result = new List<object>();

                foreach (var cliente in clientes)
                {
                    result.Add(new
                    {
                        cliente.Id,
                        cliente.Cedula,
                        cliente.Nombre,
                        cliente.Telefono,
                        cliente.Email,
                        cliente.Direccion,
                        cliente.CreationTime
                    });
                }

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(Guid id)
        {
            try
            {
                var cliente = await _clienteRepository.GetAsync(id);

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        cliente.Id,
                        cliente.Cedula,
                        cliente.Nombre,
                        cliente.Telefono,
                        cliente.Email,
                        cliente.Direccion,
                        cliente.CreationTime
                    }
                });
            }
            catch (Exception ex)
            {
                return NotFound(new { success = false, error = "Cliente no encontrado", details = ex.Message });
            }
        }

        [HttpGet("cedula/{cedula}")]
        public async Task<IActionResult> GetByCedula(string cedula)
        {
            try
            {
                var cliente = await _clienteRepository.FirstOrDefaultAsync(c => c.Cedula == cedula);

                if (cliente == null)
                    return NotFound(new { success = false, error = $"Cliente con cédula {cedula} no encontrado" });

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        cliente.Id,
                        cliente.Cedula,
                        cliente.Nombre,
                        cliente.Telefono,
                        cliente.Email,
                        cliente.Direccion,
                        cliente.CreationTime
                    }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateClienteDto input)
        {
            try
            {
                var cliente = await _clienteRepository.GetAsync(id);

                cliente.Cedula = input.Cedula;
                cliente.Nombre = input.Nombre;
                cliente.Telefono = input.Telefono;
                cliente.Email = input.Email;
                cliente.Direccion = input.Direccion;

                cliente = await _clienteRepository.UpdateAsync(cliente, autoSave: true);

                return Ok(new
                {
                    success = true,
                    message = "Cliente actualizado exitosamente",
                    data = new
                    {
                        cliente.Id,
                        cliente.Cedula,
                        cliente.Nombre,
                        cliente.Telefono,
                        cliente.Email,
                        cliente.Direccion,
                        cliente.CreationTime
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
                await _clienteRepository.DeleteAsync(id, autoSave: true);
                return Ok(new { success = true, message = "Cliente eliminado exitosamente" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }
    }

    public class CreateClienteDto
    {
        public string Cedula { get; set; }
        public string Nombre { get; set; }
        public string Telefono { get; set; }
        public string Email { get; set; }
        public string Direccion { get; set; }
    }

    public class UpdateClienteDto
    {
        public string Cedula { get; set; }
        public string Nombre { get; set; }
        public string Telefono { get; set; }
        public string Email { get; set; }
        public string Direccion { get; set; }
    }
}