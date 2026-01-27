using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace MecanicApp.Entities
{
    public class Vehiculo : FullAuditedAggregateRoot<Guid>
    {
        public string Placa { get; set; }
        public string Marca { get; set; }
        public string Modelo { get; set; }
        public int? Anio { get; set; }
        public string Color { get; set; }
        public decimal? Kilometraje { get; set; }

        public Guid ClienteId { get; set; }

        public virtual Cliente Cliente { get; set; }

        public Vehiculo() { }

        public Vehiculo(string placa, string marca, string modelo, Guid clienteId)
        {
            Placa = placa;
            Marca = marca;
            Modelo = modelo;
            ClienteId = clienteId;
        }
    }
}