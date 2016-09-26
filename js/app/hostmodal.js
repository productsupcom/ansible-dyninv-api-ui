var HostModal = {};
HostModal.vm = (function () {
    var vm = {};
    return vm;
})();
HostModal.controller = function (params) {
    var ctrl = this;
    ctrl.host = params.host;
    ctrl.ok = function () {
        ctrl.$modal.close();
    };
    ctrl.cancel = function () {
        ctrl.$modal.dismiss("Cancel");
    };
};
HostModal.view = function (ctrl) {
    return m("div", [
        m("div", { class: "modal-header" }, [m("h3", { class: "modal-title" }, ["Edit Host"])]),
        m("div", { class: "modal-body" }, [
            m("div", { class: "panel panel-info" }, [
                m("div", { class: "panel-heading" }, [m("h3", { class: "panel-title" }, "Information")]),
                m("div", { class: "panel-body" }, [
                    m("div", { class: "form-horizontal"}, [
                        m("div", { class: "form-group" }, [
                            m("div", { class: "col-sm-offset-2 col-sm-10"}, [
                            m("div", { class: "checkbox" }, [
                                m("label", {for:"enabled"}, [
                                    m("input", {
                                        id:"enabled",
                                        type:"checkbox",
                                        onchange: m.withAttr("checked", Host.vm.host.d.enabled),
                                        checked: Host.vm.host.d.enabled()
                                    })], "Enabled")]),
                            ]),
                        ]),
                        m("div", { class: "form-group" }, [
                            m("label", {for:"ip", class: "col-sm-2 control-label"}, "IP"),
                            m("div", {class:"col-sm-10"}, [
                            m("input", {
                                id:"ip",
                                class:"form-control",
                                onchange: m.withAttr("value", Host.vm.host.d.ip),
                                value: Host.vm.host.d.ip()
                            }),
                            ]),
                        ]),
                         m("div", { class: "form-group" }, [
                            m("label", {for:"hostname", class: "col-sm-2 control-label"}, "Hostname"),
                            m("div", {class:"col-sm-10"}, [
                            m("input", {
                                id:"hostname",
                                class:"form-control",
                                onchange: m.withAttr("value", Host.vm.host.d.hostname),
                                value: Host.vm.host.d.hostname()
                            }),
                            ]),
                        ]),
                         m("div", { class: "form-group" }, [
                            m("label", {for:"host", class: "col-sm-2 control-label"}, "Host"),
                            m("div", {class:"col-sm-10"}, [
                            m("input", {
                                id:"host",
                                class:"form-control",
                                onchange: m.withAttr("value", Host.vm.host.d.host),
                                value: Host.vm.host.d.host()
                            }),
                            ]),
                        ]),
                         m("div", { class: "form-group" }, [
                            m("label", {for:"domain", class: "col-sm-2 control-label"}, "Domain"),
                            m("div", {class:"col-sm-10"}, [
                            m("input", {
                                id:"domain",
                                class:"form-control",
                                onchange: m.withAttr("value", Host.vm.host.d.domain),
                                value: Host.vm.host.d.domain()
                            }),
                            ]),
                        ]),
                    ]),
                ]),
            ]),
            m("div", { class: "panel panel-info" }, [
                m("div", { class: "panel-heading" }, [m("h3", { class: "panel-title" }, "Variables")]),
                m("div", [m("div[id=hostEditorvariables]", { style: { height: "400px" } })])
            ]),
            m("div", { class: "panel panel-info" }, [
                m("div", { class: "panel-heading" }, [m("h3", { class: "panel-title" }, "Groups")]),
                m("div", [m("select[id=groupSelect]", { multiple: "multiple" }, [
                        Host.vm.groups.map(function (group) {
                            return m("option", {
                                value: group.d.id(),
                                selected: Host.vm.inGroup(group)
                            }, group.d.name());
                        })])])
            ]),
            m("div", { class: "modal-footer" }, [
                m("button", {
                    class: "btn btn-default",
                    onclick: function () {
                        ctrl.cancel();
                    }
                }, "Cancel"),
                m("button[class=btn btn-primary]", {
                    onclick: function () {
                        ctrl.ok();
                    }
                }, "Save")
            ])
        ])
    ]);
};
