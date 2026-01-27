using System;
using System.Collections.Generic;
using Volo.Abp.Domain.Entities.Auditing;

namespace MecanicApp.Entities
{
    public class OrdenServicio : FullAuditedAggregateRoot<Guid>
    {
        public string Codigo { get; set; } // Ej: ORD-2025-001
        public Guid VehiculoId { get; set; }
        public virtual Vehiculo Vehiculo { get; set; }

        public DateTime FechaEntrada { get; set; }
        public DateTime? FechaSalida { get; set; }

        // Estados: COTIZACION, APROBADA, EN_PROGRESO, COMPLETADA, FACTURADA, CANCELADA
        public string Estado { get; set; } = "COTIZACION";

        public string Observaciones { get; set; }

        // Totales
        public decimal SubtotalServicios { get; set; }
        public decimal SubtotalProductos { get; set; }
        public decimal Descuento { get; set; }
        public decimal Impuesto { get; set; }
        public decimal Total { get; set; }

        // Relaciones
        public virtual ICollection<OrdenServicioDetalle> Detalles { get; set; }

        public OrdenServicio()
        {
            Detalles = new HashSet<OrdenServicioDetalle>();
            FechaEntrada = DateTime.Now;
        }

        public OrdenServicio(string codigo, Guid vehiculoId)
        {
            Codigo = codigo;
            VehiculoId = vehiculoId;
            FechaEntrada = DateTime.Now;
            Detalles = new HashSet<OrdenServicioDetalle>();
        }

        // Método para calcular totales
        public void CalcularTotales()
        {
            SubtotalServicios = 0;
            SubtotalProductos = 0;

            foreach (var detalle in Detalles)
            {
                if (detalle.Tipo == "SERVICIO")
                    SubtotalServicios += detalle.Subtotal;
                else if (detalle.Tipo == "PRODUCTO")
                    SubtotalProductos += detalle.Subtotal;
            }

            var subtotal = SubtotalServicios + SubtotalProductos;
            Impuesto = subtotal * 0.12m; // 12% IVA (ajustar según país)
            Total = subtotal + Impuesto - Descuento;
        }
    }
}