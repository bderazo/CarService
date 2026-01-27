using Volo.Abp.Modularity;

namespace MecanicApp;

[DependsOn(
    typeof(MecanicAppDomainModule),
    typeof(MecanicAppTestBaseModule)
)]
public class MecanicAppDomainTestModule : AbpModule
{

}
