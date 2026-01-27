using MecanicApp.EntityFrameworkCore;
using Volo.Abp.Autofac;
using Volo.Abp.Modularity;

namespace MecanicApp.DbMigrator;

[DependsOn(
    typeof(AbpAutofacModule),
    typeof(MecanicAppEntityFrameworkCoreModule),
    typeof(MecanicAppApplicationContractsModule)
    )]
public class MecanicAppDbMigratorModule : AbpModule
{
}
