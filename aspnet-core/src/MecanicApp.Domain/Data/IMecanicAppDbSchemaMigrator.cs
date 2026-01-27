using System.Threading.Tasks;

namespace MecanicApp.Data;

public interface IMecanicAppDbSchemaMigrator
{
    Task MigrateAsync();
}
