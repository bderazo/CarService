using MecanicApp.Localization;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Localization;

namespace MecanicApp.Permissions;

public class MecanicAppPermissionDefinitionProvider : PermissionDefinitionProvider
{
    public override void Define(IPermissionDefinitionContext context)
    {
        var myGroup = context.AddGroup(MecanicAppPermissions.GroupName);
        //Define your own permissions here. Example:
        //myGroup.AddPermission(MecanicAppPermissions.MyPermission1, L("Permission:MyPermission1"));
    }

    private static LocalizableString L(string name)
    {
        return LocalizableString.Create<MecanicAppResource>(name);
    }
}
