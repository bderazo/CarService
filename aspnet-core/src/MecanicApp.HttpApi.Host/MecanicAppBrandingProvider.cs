using Microsoft.Extensions.Localization;
using MecanicApp.Localization;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Ui.Branding;

namespace MecanicApp;

[Dependency(ReplaceServices = true)]
public class MecanicAppBrandingProvider : DefaultBrandingProvider
{
    private IStringLocalizer<MecanicAppResource> _localizer;

    public MecanicAppBrandingProvider(IStringLocalizer<MecanicAppResource> localizer)
    {
        _localizer = localizer;
    }

    public override string AppName => _localizer["AppName"];
}
