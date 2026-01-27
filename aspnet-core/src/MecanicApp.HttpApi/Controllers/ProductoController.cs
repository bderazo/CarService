using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp.AspNetCore.Mvc;
using Volo.Abp.Domain.Repositories;
using MecanicApp.Entities;

namespace MecanicApp.Controllers
{
    [Route("api/productos")]
    public class ProductoController : AbpController
    {
        private readonly IRepository<Producto, Guid> _productoRepository;

        public ProductoController(IRepository<Producto, Guid> productoRepository)
        {
            _productoRepository = productoRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var productos = await _productoRepository.GetListAsync();
            return Ok(new { success = true, data = productos });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Producto input)
        {
            var producto = await _productoRepository.InsertAsync(input, autoSave: true);
            return Ok(new { success = true, data = producto });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] Producto input)
        {
            var producto = await _productoRepository.GetAsync(id);

            producto.Codigo = input.Codigo;
            producto.Nombre = input.Nombre;
            producto.Descripcion = input.Descripcion;
            producto.PrecioCompra = input.PrecioCompra;
            producto.PrecioVenta = input.PrecioVenta;
            producto.Stock = input.Stock;
            producto.StockMinimo = input.StockMinimo;
            producto.EsActivo = input.EsActivo;

            producto = await _productoRepository.UpdateAsync(producto, autoSave: true);
            return Ok(new { success = true, data = producto });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _productoRepository.DeleteAsync(id, autoSave: true);
            return Ok(new { success = true, message = "Producto eliminado" });
        }
    }
}