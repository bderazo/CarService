using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace MecanicApp.Entities
{
    public class Servicio : FullAuditedAggregateRoot<Guid>
    {
        public string Codigo { get; set; }
        public string Nombre { get; set; }
        public string Descripcion { get; set; }
        public int? DuracionEstimada { get; set; } 
        public decimal Precio { get; set; }
        public bool EsActivo { get; set; } = true;

        public Servicio() { }

        public Servicio(string codigo, string nombre, decimal precio)
        {
            Codigo = codigo;
            Nombre = nombre;
            Precio = precio;
        }
    }
}