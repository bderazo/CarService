// Entities/OrdenServicioUsuario.cs
using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace MecanicApp.Entities
{
    public class OrdenServicioUsuario : FullAuditedAggregateRoot<Guid>
    {
        public Guid OrdenServicioId { get; set; }
        public virtual OrdenServicio OrdenServicio { get; set; }

        public Guid UsuarioId { get; set; } // El ID del usuario de Identity
        public string? UserName { get; set; } // Para mostrar en el frontend
        public string? NombreCompleto { get; set; } // Para mostrar en el frontend

        // Roles específicos para esta orden
        public string Rol { get; set; } // "Recepcionista", "Mecanico", "lavacoches"

        // Estado de la asignación
        public string Estado { get; set; } = "ASIGNADO"; // "ASIGNADO", "COMPLETADO", "CANCELADO"

        public DateTime FechaAsignacion { get; set; }
        public DateTime? FechaCompletado { get; set; }

        public string? Observaciones { get; set; }

        public OrdenServicioUsuario()
        {
            FechaAsignacion = DateTime.Now;
        }

        public OrdenServicioUsuario(Guid ordenServicioId, Guid usuarioId, string rol)
        {
            OrdenServicioId = ordenServicioId;
            UsuarioId = usuarioId;
            Rol = rol;
            FechaAsignacion = DateTime.Now;
            Estado = "ASIGNADO";
            UserName = string.Empty;
            NombreCompleto = string.Empty;
            Observaciones = string.Empty;
        }
    }
}