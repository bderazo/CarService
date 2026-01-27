using Volo.Abp.Modularity;

namespace MecanicApp;

[DependsOn(
    typeof(MecanicAppApplicationModule),
    typeof(MecanicAppDomainTestModule)
)]
public class MecanicAppApplicationTestModule : AbpModule
{

}
