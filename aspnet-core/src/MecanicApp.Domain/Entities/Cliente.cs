using System;
using System.Collections.Generic;
using Volo.Abp.Domain.Entities.Auditing;

namespace MecanicApp.Entities
{
    public class Cliente : FullAuditedAggregateRoot<Guid>
    {
        public string Cedula { get; set; }
        public string Nombre { get; set; }
        public string Telefono { get; set; }
        public string Email { get; set; }
        public string Direccion { get; set; }

        public virtual ICollection<Vehiculo> Vehiculos { get; set; }

        public Cliente()
        {
            Vehiculos = new HashSet<Vehiculo>();
        }

        public Cliente(string cedula, string nombre, string telefono)
        {
            Cedula = cedula;
            Nombre = nombre;
            Telefono = telefono;
            Vehiculos = new HashSet<Vehiculo>();
        }
    }
}