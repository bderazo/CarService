using Xunit;

namespace MecanicApp.EntityFrameworkCore;

[CollectionDefinition(MecanicAppTestConsts.CollectionDefinitionName)]
public class MecanicAppEntityFrameworkCoreCollection : ICollectionFixture<MecanicAppEntityFrameworkCoreFixture>
{

}
