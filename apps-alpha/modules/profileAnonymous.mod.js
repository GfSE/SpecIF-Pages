"use strict";
/*!	User profile - simple implementation without identity and permissions.
    Dependencies: -
    (C)copyright enso managers gmbh (http://enso-managers.de)
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    Author: se@enso-managers.de, Berlin
    We appreciate any correction, comment or contribution as Github issue (https://github.com/enso-managers/SpecIF-Tools/issues)
*/
moduleManager.construct({
    name: 'profileAnonymous'
}, function (self) {
    "use strict";
    self.init = function () {
        self.clear();
        return true;
    };
    self.clear = function () {
        self.loggedin = false;
        self.userName = CONFIG.userNameAnonymous;
        self.userPassword = CONFIG.passwordAnonymous;
        self.administrator = false;
        self.roleAssignments = [
            new CRoleAssignment("any", app.title == i18n.LblEditor ? "SpecIF:Editor" : "SpecIF:Reader"),
            new CRoleAssignment("P-DDP-Classes-V20", "SpecIF:Editor"),
            new CRoleAssignment("P-DDP-Ontology-V20", "SpecIF:Editor")
        ];
    };
    self.login = function () {
        return new Promise((resolve) => {
            self.loggedin = true;
            resolve(self);
        });
    };
    self.myRole = function (prjId) {
        let ra = LIB.itemBy(self.roleAssignments, 'project', prjId);
        if (ra)
            return ra.role;
        ra = LIB.itemBy(self.roleAssignments, 'project', 'any');
        if (ra)
            return ra.role;
        throw Error('User profile of ' + self.userName + ' has no role assignments.');
    };
    self.logout = function () {
        self.loggedin = false;
    };
    self.isAdministrator = function () {
        return self.administrator;
    };
    return self;
});
