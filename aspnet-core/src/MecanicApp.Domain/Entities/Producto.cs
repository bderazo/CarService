using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace MecanicApp.Entities
{
    public class Producto : FullAuditedAggregateRoot<Guid>
    {
        public string Codigo { get; set; }
        public string Nombre { get; set; }
        public string Descripcion { get; set; }
        public decimal? PrecioCompra { get; set; }
        public decimal PrecioVenta { get; set; }
        public int Stock { get; set; } = 0;
        public int StockMinimo { get; set; } = 5;
        public bool EsActivo { get; set; } = true;

        public Producto() { }

        public Producto(string codigo, string nombre, decimal precioVenta)
        {
            Codigo = codigo;
            Nombre = nombre;
            PrecioVenta = precioVenta;
        }
    }
}