using MecanicApp.Entities;
using Microsoft.EntityFrameworkCore;
using Volo.Abp.AuditLogging.EntityFrameworkCore;
using Volo.Abp.BackgroundJobs.EntityFrameworkCore;
using Volo.Abp.Data;
using Volo.Abp.DependencyInjection;
using Volo.Abp.EntityFrameworkCore;
using Volo.Abp.FeatureManagement.EntityFrameworkCore;
using Volo.Abp.Identity;
using Volo.Abp.Identity.EntityFrameworkCore;
using Volo.Abp.OpenIddict.EntityFrameworkCore;
using Volo.Abp.PermissionManagement.EntityFrameworkCore;
using Volo.Abp.SettingManagement.EntityFrameworkCore;
using Volo.Abp.TenantManagement;
using Volo.Abp.TenantManagement.EntityFrameworkCore;

namespace MecanicApp.EntityFrameworkCore;

[ReplaceDbContext(typeof(IIdentityDbContext))]
[ReplaceDbContext(typeof(ITenantManagementDbContext))]
[ConnectionStringName("Default")]
public class MecanicAppDbContext :
    AbpDbContext<MecanicAppDbContext>,
    IIdentityDbContext,
    ITenantManagementDbContext
{
    /* Add DbSet properties for your Aggregate Roots / Entities here. */

    public DbSet<Cliente> Clientes { get; set; }
    public DbSet<Vehiculo> Vehiculos { get; set; }
    public DbSet<Servicio> Servicios { get; set; }
    public DbSet<Producto> Productos { get; set; }
    public DbSet<OrdenServicio> OrdenesServicio { get; set; }
    public DbSet<OrdenServicioDetalle> OrdenServicioDetalles { get; set; }

    #region Entities from the modules

    /* Notice: We only implemented IIdentityDbContext and ITenantManagementDbContext
     * and replaced them for this DbContext. This allows you to perform JOIN
     * queries for the entities of these modules over the repositories easily. You
     * typically don't need that for other modules. But, if you need, you can
     * implement the DbContext interface of the needed module and use ReplaceDbContext
     * attribute just like IIdentityDbContext and ITenantManagementDbContext.
     *
     * More info: Replacing a DbContext of a module ensures that the related module
     * uses this DbContext on runtime. Otherwise, it will use its own DbContext class.
     */

    //Identity
    public DbSet<IdentityUser> Users { get; set; }
    public DbSet<IdentityRole> Roles { get; set; }
    public DbSet<IdentityClaimType> ClaimTypes { get; set; }
    public DbSet<OrganizationUnit> OrganizationUnits { get; set; }
    public DbSet<IdentitySecurityLog> SecurityLogs { get; set; }
    public DbSet<IdentityLinkUser> LinkUsers { get; set; }
    public DbSet<IdentityUserDelegation> UserDelegations { get; set; }
    public DbSet<IdentitySession> Sessions { get; set; }
    // Tenant Management
    public DbSet<Tenant> Tenants { get; set; }
    public DbSet<TenantConnectionString> TenantConnectionStrings { get; set; }

    #endregion

    public MecanicAppDbContext(DbContextOptions<MecanicAppDbContext> options)
        : base(options)
    {

    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);


        builder.ConfigurePermissionManagement();
        builder.ConfigureSettingManagement();
        builder.ConfigureBackgroundJobs();
        builder.ConfigureAuditLogging();
        builder.ConfigureIdentity();
        builder.ConfigureOpenIddict();
        builder.ConfigureFeatureManagement();
        builder.ConfigureTenantManagement();

        builder.Entity<Cliente>(b =>
        {
            b.ToTable("Clientes");
            b.Property(x => x.Cedula).HasMaxLength(20).IsRequired();
            b.Property(x => x.Nombre).HasMaxLength(100).IsRequired();
            b.Property(x => x.Telefono).HasMaxLength(15);
            b.Property(x => x.Email).HasMaxLength(100);
            b.Property(x => x.Direccion).HasMaxLength(200);

            b.HasIndex(x => x.Cedula).IsUnique();
        });

        builder.Entity<Vehiculo>(b =>
        {
            b.ToTable("Vehiculos");
            b.Property(x => x.Placa).HasMaxLength(15).IsRequired();
            b.Property(x => x.Marca).HasMaxLength(50).IsRequired();
            b.Property(x => x.Modelo).HasMaxLength(50).IsRequired();
            b.Property(x => x.Color).HasMaxLength(30);

            b.HasIndex(x => x.Placa).IsUnique();

            b.HasOne(x => x.Cliente)
                .WithMany(x => x.Vehiculos)
                .HasForeignKey(x => x.ClienteId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Servicio>(b =>
        {
            b.ToTable("Servicios");
            b.Property(x => x.Codigo).HasMaxLength(20).IsRequired();
            b.Property(x => x.Nombre).HasMaxLength(100).IsRequired();
            b.Property(x => x.Descripcion).HasMaxLength(500);
            b.Property(x => x.Precio).HasPrecision(10, 2);

            b.HasIndex(x => x.Codigo).IsUnique();
        });

        builder.Entity<Producto>(b =>
        {
            b.ToTable("Productos");
            b.Property(x => x.Codigo).HasMaxLength(20).IsRequired();
            b.Property(x => x.Nombre).HasMaxLength(100).IsRequired();
            b.Property(x => x.Descripcion).HasMaxLength(500);
            b.Property(x => x.PrecioCompra).HasPrecision(10, 2);
            b.Property(x => x.PrecioVenta).HasPrecision(10, 2);

            b.HasIndex(x => x.Codigo).IsUnique();
        });

        builder.Entity<OrdenServicio>(b =>
        {
            b.ToTable("OrdenesServicio");
            b.Property(x => x.Codigo).HasMaxLength(20).IsRequired();
            b.Property(x => x.Estado).HasMaxLength(20).HasDefaultValue("COTIZACION");
            b.Property(x => x.Observaciones).HasMaxLength(1000);
            b.Property(x => x.SubtotalServicios).HasPrecision(10, 2);
            b.Property(x => x.SubtotalProductos).HasPrecision(10, 2);
            b.Property(x => x.Descuento).HasPrecision(10, 2);
            b.Property(x => x.Impuesto).HasPrecision(10, 2);
            b.Property(x => x.Total).HasPrecision(10, 2);

            b.HasIndex(x => x.Codigo).IsUnique();

            b.HasOne(x => x.Vehiculo)
                .WithMany()
                .HasForeignKey(x => x.VehiculoId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<OrdenServicioDetalle>(b =>
        {
            b.ToTable("OrdenServicioDetalles");
            b.Property(x => x.Tipo).HasMaxLength(10).IsRequired();
            b.Property(x => x.Descripcion).HasMaxLength(200);
            b.Property(x => x.PrecioUnitario).HasPrecision(10, 2);
            b.Property(x => x.Subtotal).HasPrecision(10, 2);
            b.Property(x => x.Observaciones).HasMaxLength(500);

            b.HasOne(x => x.OrdenServicio)
                .WithMany(x => x.Detalles)
                .HasForeignKey(x => x.OrdenServicioId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(x => x.Servicio)
                .WithMany()
                .HasForeignKey(x => x.ServicioId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired(false);

            b.HasOne(x => x.Producto)
                .WithMany()
                .HasForeignKey(x => x.ProductoId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired(false);
        });
    }
}
