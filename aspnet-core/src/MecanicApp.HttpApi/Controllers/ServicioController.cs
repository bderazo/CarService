using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp.AspNetCore.Mvc;
using Volo.Abp.Domain.Repositories;
using MecanicApp.Entities;

namespace MecanicApp.Controllers
{
    [Route("api/servicios")]
    public class ServicioController : AbpController
    {
        private readonly IRepository<Servicio, Guid> _servicioRepository;

        public ServicioController(IRepository<Servicio, Guid> servicioRepository)
        {
            _servicioRepository = servicioRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var servicios = await _servicioRepository.GetListAsync();
            return Ok(new { success = true, data = servicios });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Servicio input)
        {
            var servicio = await _servicioRepository.InsertAsync(input, autoSave: true);
            return Ok(new { success = true, data = servicio });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] Servicio input)
        {
            var servicio = await _servicioRepository.GetAsync(id);

            servicio.Codigo = input.Codigo;
            servicio.Nombre = input.Nombre;
            servicio.Descripcion = input.Descripcion;
            servicio.DuracionEstimada = input.DuracionEstimada;
            servicio.Precio = input.Precio;
            servicio.EsActivo = input.EsActivo;

            servicio = await _servicioRepository.UpdateAsync(servicio, autoSave: true);
            return Ok(new { success = true, data = servicio });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _servicioRepository.DeleteAsync(id, autoSave: true);
            return Ok(new { success = true, message = "Servicio eliminado" });
        }
    }
}