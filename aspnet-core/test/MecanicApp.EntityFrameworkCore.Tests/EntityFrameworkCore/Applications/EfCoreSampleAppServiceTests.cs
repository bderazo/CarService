using MecanicApp.Samples;
using Xunit;

namespace MecanicApp.EntityFrameworkCore.Applications;

[Collection(MecanicAppTestConsts.CollectionDefinitionName)]
public class EfCoreSampleAppServiceTests : SampleAppServiceTests<MecanicAppEntityFrameworkCoreTestModule>
{

}
