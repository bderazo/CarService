using System.Threading.Tasks;
using Volo.Abp.DependencyInjection;

namespace MecanicApp.Data;

/* This is used if database provider does't define
 * IMecanicAppDbSchemaMigrator implementation.
 */
public class NullMecanicAppDbSchemaMigrator : IMecanicAppDbSchemaMigrator, ITransientDependency
{
    public Task MigrateAsync()
    {
        return Task.CompletedTask;
    }
}
