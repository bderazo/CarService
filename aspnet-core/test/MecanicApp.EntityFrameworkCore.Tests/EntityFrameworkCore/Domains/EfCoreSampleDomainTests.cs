using MecanicApp.Samples;
using Xunit;

namespace MecanicApp.EntityFrameworkCore.Domains;

[Collection(MecanicAppTestConsts.CollectionDefinitionName)]
public class EfCoreSampleDomainTests : SampleDomainTests<MecanicAppEntityFrameworkCoreTestModule>
{

}
