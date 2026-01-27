using System;
using Volo.Abp.Domain.Entities;

namespace MecanicApp.Entities
{
    public class OrdenServicioDetalle : Entity<Guid>
    {
        public Guid OrdenServicioId { get; set; }
        public virtual OrdenServicio OrdenServicio { get; set; }

        public Guid? ServicioId { get; set; }
        public virtual Servicio Servicio { get; set; }

        public Guid? ProductoId { get; set; }
        public virtual Producto Producto { get; set; }

        public string Tipo { get; set; } 
        public string Descripcion { get; set; }
        public int Cantidad { get; set; } = 1;
        public decimal PrecioUnitario { get; set; }
        public decimal Subtotal { get; set; }
        public string Observaciones { get; set; }

        public void CalcularSubtotal()
        {
            Subtotal = Cantidad * PrecioUnitario;
        }
    }
}