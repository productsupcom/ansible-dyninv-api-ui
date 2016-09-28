var EditModal = {};
EditModal.vm = (function () {
    var vm = {};
    return vm;
})();
EditModal.controller = function (params) {
    var ctrl = this;
    ctrl.params = params;
    ctrl.ok = function () {
        ctrl.$modal.close();
    };
    ctrl.cancel = function () {
        ctrl.$modal.dismiss("Cancel");
    };
};
EditModal.view = function (ctrl) {
    var vm = ctrl.params.vm;
    var object = ctrl.params.object;
    return m("div", [
        m("div", { class: "modal-header" }, [m("h3", { class: "modal-title" }, [vm.editorTitle])]),
        m("div", { class: "modal-body" }, [
            m("div", { class: "panel panel-info" }, [
                m("div", { class: "panel-heading" }, [m("h3", { class: "panel-title" }, "Information")]),
                m("div", { class: "panel-body" }, [
                    m("div", { class: "form-horizontal"}, [

                        (function(){
                            var form = [];

                            vm[object].columns.filter(function(el){
                                return el.editable === true;
                            }).filter(function(el){
                                return el.type === "string" || el.type === "boolean";
                            }).forEach(function(editable){
                                if (editable.type === "string") {
                                    form.push(m("div", { class: "form-group" }, [
                                        m("label", {for:editable.object, class: "col-sm-2 control-label"}, editable.name),
                                        m("div", {class:"col-sm-10"}, [
                                        m("input", {
                                            id:editable.object,
                                            class:"form-control",
                                            onchange: m.withAttr("value", vm[object].d[editable.object]),
                                            value: vm[object].d[editable.object]()
                                        }),
                                        ]),
                                    ]));
                                }
                                if (editable.type === "boolean") {
                                    form.push(m("div", { class: "form-group" }, [
                                        m("div", { class: "col-sm-offset-2 col-sm-10"}, [
                                        m("div", { class: "checkbox" }, [
                                            m("label", {for:editable.object}, [
                                                m("input", {
                                                    id:editable.object,
                                                    type:"checkbox",
                                                    onchange: m.withAttr("checked", vm[object].d[editable.object]),
                                                    checked: vm[object].d[editable.object]()
                                                })], editable.name)]),
                                        ]),
                                    ]));
                                }
                            });

                            return form;
                        })(),
                    ]),
                ]),
            ]),
            (function(){
                var form = [];
                vm[object].columns.filter(function(el){
                    return el.editable === true;
                }).filter(function(el){
                    return el.type !== "string" && el.type !== "boolean";
                }).forEach(function(editable){
                    if (editable.type === "jsoneditor") {
                        form.push(m("div", { class: "panel panel-info" }, [
                            m("div", { class: "panel-heading" }, [m("h3", { class: "panel-title" }, editable.name)]),
                            m("div", [m("div", { id: editable.type+editable.object, style: { height: "400px" } })])
                        ]));
                    }

                    if (editable.type === "select2") {
                        form.push(m("div", { class: "panel panel-info" }, [
                            m("div", { class: "panel-heading" }, [m("h3", { class: "panel-title" }, editable.name)]),
                            m("div", [m("select", {id: editable.type+editable.object, multiple: "multiple" }, [
                               vm[editable.object].map(function (el) {
                                   return m("option", {
                                       value: el.d.id(),
                                       selected: vm[editable.method](el)
                                   }, el.d.name());
                               })])])
                        ]));
                    }
                });

                return form;
            })(),
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
