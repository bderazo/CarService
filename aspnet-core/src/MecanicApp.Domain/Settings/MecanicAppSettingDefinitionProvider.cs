using Volo.Abp.Settings;

namespace MecanicApp.Settings;

public class MecanicAppSettingDefinitionProvider : SettingDefinitionProvider
{
    public override void Define(ISettingDefinitionContext context)
    {
        //Define your own settings here. Example:
        //context.Add(new SettingDefinition(MecanicAppSettings.MySetting1));
    }
}
