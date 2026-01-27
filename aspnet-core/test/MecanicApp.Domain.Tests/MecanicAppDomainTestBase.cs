using Volo.Abp.Modularity;

namespace MecanicApp;

/* Inherit from this class for your domain layer tests. */
public abstract class MecanicAppDomainTestBase<TStartupModule> : MecanicAppTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{

}
