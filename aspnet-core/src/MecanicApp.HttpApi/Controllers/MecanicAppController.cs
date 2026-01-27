using MecanicApp.Localization;
using Volo.Abp.AspNetCore.Mvc;

namespace MecanicApp.Controllers;

/* Inherit your controllers from this class.
 */
public abstract class MecanicAppController : AbpControllerBase
{
    protected MecanicAppController()
    {
        LocalizationResource = typeof(MecanicAppResource);
    }
}
