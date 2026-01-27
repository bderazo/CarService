using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MecanicApp.Data;
using Volo.Abp.DependencyInjection;

namespace MecanicApp.EntityFrameworkCore;

public class EntityFrameworkCoreMecanicAppDbSchemaMigrator
    : IMecanicAppDbSchemaMigrator, ITransientDependency
{
    private readonly IServiceProvider _serviceProvider;

    public EntityFrameworkCoreMecanicAppDbSchemaMigrator(
        IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public async Task MigrateAsync()
    {
        /* We intentionally resolve the MecanicAppDbContext
         * from IServiceProvider (instead of directly injecting it)
         * to properly get the connection string of the current tenant in the
         * current scope.
         */

        await _serviceProvider
            .GetRequiredService<MecanicAppDbContext>()
            .Database
            .MigrateAsync();
    }
}
