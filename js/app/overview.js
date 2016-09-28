var Overview = {
    controller: function(args, extras) {
        return {
            vm: args.vm,
            nameObject: args.nameObject,
            singular: args.singular,
            type: args.type,
            pager: (function(){
                var pager = {};
                pager.totalItems = function () {
                    return args.vm.list() ? args.vm.list().length : 0;
                }.bind(pager);
                pager.currentPage = m.prop(0);
                pager.itemsPerPage = m.prop(25);
                pager.maxSize = 7;
                pager.directionLinks = true;
                pager.boundaryLinks = true;
                pager.previousText = "<";
                pager.nextText = ">";
                pager.pagination = m.u.init(m.ui.pagination(pager));

                return pager;
            })(),
        };
    },
    view: function(ctrl, args) {
        var vm = ctrl.vm;
        return m("div", { class: "panel panel-default" }, [
            m("div", { class: "panel-heading" }, [m("h3", { class: "panel-title" }, "Available "+ctrl.type+"s")]),
            m("div", { class: "panel-body" }, [
                m("button", {
                    class: "btn btn-default",
                    onclick: m.withAttr("data-id", function () {
                        vm.create();
                    })
                }, "New "+ctrl.type),
                m("div", [ctrl.pager.pagination.$view()]),
                m("div", { class: "btn-group" }, [
                    m("button", {
                        class: "btn btn-default",
                        config: m.ui.configRadio(vm.pickButtons, "none")
                    }, ["None"]),
                    m("button", {
                        class: "btn btn-default",
                        config: m.ui.configRadio(vm.pickButtons, "inverse")
                    }, ["Inverse"]),
                    m("button", {
                        class: "btn btn-default",
                        config: m.ui.configRadio(vm.pickButtons, "all")
                    }, ["All"])
                ]),
                m("div", {
                    class: "btn-group",
                    config: m.ui.configDropdown()
                }, [
                    m("button", {
                        type: "button",
                        class: "btn btn-default dropdown-toggle"
                    }, [
                        m("span", { class: "glyphicon glyphicon-cog" }),
                        m("span", { class: "caret" })
                    ]),
                    m("ul", {
                        class: "dropdown-menu",
                        role: "menu"
                    }, [
                        m("li", [m("a", { onclick: vm.showAllColumns }, ["Show all Columns"])]),
                        (function () {
                            var cols = [];
                            Object.keys(vm.columns).forEach(function (column) {
                                cols.push(m("li", [m("a", [m("label", {for:"colShow" + column}, [m("input", {
                                    id:"colShow" + column,
                                    type:"checkbox",
                                    onchange: m.withAttr("checked", vm.columns[column]),
                                    checked: vm.columns[column]()
                                })], column)])]));
                            });
                            return cols;
                        })(),
                        m("li", { class: "divider" }),
                        m("li", [
                            m("label", {for:"itemsPerPage"}, "Items per Page"),
                            m("input", {
                                id:"itemsPerPage",
                                type:"number",
                                step:10,
                                onchange: m.withAttr("value", ctrl.pager.itemsPerPage),
                                value: ctrl.pager.itemsPerPage()
                            })
                        ])
                    ])
                ])
            ]),
            m("div", {}, ctrl.type+"(s) selected: ", vm.picked().length),
            m("label", {for:"listFilter"}, "Search"),
            m("input", {
                id:"listFilter",
                onchange: m.withAttr("value", vm.listFilter),
                value: vm.listFilter()
            }),
            // sorts() works with Hosts.list() because that is used by vm.list(), but since vm.list() is not a real array it currently is unable to sort
            // FIXME
            m("table", {class:"table table-condensed table-striped table-hover"}, sorts(vm.list()), [
                m("thead", [m("tr", [
                    m("th", {}, "Pick"),
                    m("th", {}, "Options"),
                    (function () {
                        var header = [];
                        ctrl.nameObject.columns.filter(function(column){
                            if (Object.keys(vm.columns).indexOf(column.object) !== -1) {
                                return true;
                            }
                            return false;
                        }).forEach(function(column){
                            if (vm.columns[column.object]()) {
                                header.push(m("th", {"data-sort-by":column.object}, column.name));
                            }
                        });
                        return header;
                    })()
                ])]),
                m("tbody", [vm.list().slice(ctrl.pager.itemsPerPage() * ctrl.pager.currentPage(), ctrl.pager.itemsPerPage() * (ctrl.pager.currentPage() + 1)).map(function (obj) {
                    return m("tr", {}, [
                        m("td", {}, m("input", {
                            type:"checkbox",
                            onclick: function (e) {
                                vm.pick(obj);
                                e.stopImmediatePropagation();
                            },
                            checked: vm.isPicked(obj)
                        })),
                        m("td", {}, [
                            m("button", {
                                onclick: function () {
                                    ctrl.singular.vm.edit(obj, true);
                                },
                                class: "btn btn-default btn-xs"
                            }, [m("span", { class: "glyphicon glyphicon-pencil" })]),
                            ctrl.singular.vm.enableButton(obj)
                        ]),
                        (function () {
                            var body = [];
                            ctrl.nameObject.columns.filter(function(column){
                                if (Object.keys(vm.columns).indexOf(column.object) !== -1) {
                                    return true;
                                }
                                return false;
                            }).forEach(function(column){
                                if (vm.columns[column.object]()) {
                                    if(column.type === "datetime") {
                                        /* globals dateFormat */
                                        body.push(m("td", {}, dateFormat(Date.parse(obj.d[column.object]()))));
                                    } else {
                                        body.push(m("td", {}, obj.d[column.object]()));
                                    }
                                }
                            });
                            return body;
                        })()
                    ]);
                })])
            ])
        ]);
    }
};
