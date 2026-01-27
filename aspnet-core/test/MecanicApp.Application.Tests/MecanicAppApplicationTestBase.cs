using Volo.Abp.Modularity;

namespace MecanicApp;

public abstract class MecanicAppApplicationTestBase<TStartupModule> : MecanicAppTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{

}
