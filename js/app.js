var log = function(value) { // jshint ignore:line
    if (value instanceof Array) {
        console.log("is an array");
    }
    console.log(value);
    return value;
};

function sorts(list) { // jshint ignore:line
    return {
        onclick: function(e) {
            var prop = e.target.getAttribute("data-sort-by");
            if (prop) {
                var first = list[0];
                list.sort(function(a, b) {
                    if (a instanceof Host || b instanceof Host) {
                        return a.d[prop]() > b.d[prop]() ? 1 : a.d[prop]() < b.d[prop]() ? -1 : 0;
                    }
                    return a[prop]() > b[prop]() ? 1 : a[prop]() < b[prop]() ? -1 : 0;
                });
                if (first === list[0]) {
                    list.reverse();
                }
            }
        }
    };
}

var menu = {};
// vm here is from the Page shown below the menu
menu.view = function(vm) {
    function btn(name, route) {
        var isCurrent = (m.route() === route);
        var click = function(){ m.route(route); };
        return m("li", {class: (isCurrent ? "active" : "")}, [
            m("a", {onclick: click}, [name]),
        ]);
    }

    return m("nav", {class:"navbar navbar-inverse navbar-fixed-top"}, [
        m("div", {class: "container-fluid"}, [
            m("div", {id:"navbar"}, [
                m("ul", {class:"nav navbar-nav"}, [
                    btn("Hosts", "/hosts"),
                    btn("Groups", "/groups"),
                ]),
                m("div", {class:"col-sm-3 col-md-3 pull-right"}, [
                    m("div", {class:"navbar-form"}, [
                        m("div", {class:"form-group has-feedback has-feedback-left"}, [
                            m("input", {
                                type:"text",
                                class:"form-control",
                                placeholder:"Search...",
                                onchange: m.withAttr("value", function(val) {
                                    vm.listFilter(val);
                                    vm.pager.pagination.setPage(0);
                                }),
                                value: vm.listFilter()
                            }),
                            m("i", {class:"form-control-feedback glyphicon glyphicon-search"})
                        ])
                    ])
                ])
            ]),
        ]),
    ]);
};

var footer = {};
footer.view = function(ctrl) {
    var vm = ctrl.vm;
    return m("footer", {}, [
        m("div", {class: "container-fluid"}, [
            m("div", {class:"row-fluid"}, [
                m("div", {class:"col-md-1"}, [
                    m("button", {
                        class: "btn btn-default",
                        onclick: m.withAttr("data-id", function () {
                            vm.create();
                        })
                    }, "New "+ctrl.type),
                ]),
                m("div", {class:"col-md-4"}, [
                    m("div", { class: "btn-group" }, [
                        m("div", {
                            class: "btn-group dropup",
                            config: m.ui.configDropdown()
                        }, [
                            m("button", {
                                type: "button",
                                class: "btn btn-info dropdown-toggle"
                            }, [
                                m("span", ["With Selected: ", vm.picked().length, " "]),
                                m("span", { class: "caret" })
                            ]),
                            m("ul", {
                                class: "dropdown-menu",
                                role: "menu"
                            }, [
                                m("li", [m("a", { onclick: function() {vm.pickedDo("enable");} }, ["Enable"])]),
                                m("li", [m("a", { onclick: function() {vm.pickedDo("disable");} }, ["Disable"])]),
                                m("li", { class: "divider" }),
                            ])
                        ]),
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
                        class: "btn-group dropup",
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
                        ])
                    ])
                ]),
                m("div", {class:"col-md-5"}, [
                    vm.pager.pagination.$view()
                ]),
            ]),
        ]),
    ]);
};

function Page(page) {
    var p = this;
    p.view = function() {
        return [
            menu.view(page[0].controller().vm),
            m("div", {class:"container-fluid"}, [
                m("div", {class:"row-fluid"}, [
                    m("div", {class:"col-md-12"}, [
                        page
                    ])
                ])
            ]),
            m("div", [
                Host.vm.modalInstance ? Host.vm.modalInstance.$view() : [],
                Group.vm.modalInstance ? Group.vm.modalInstance.$view() : []
            ]),
            footer.view(page[0].controller()),
        ];
    };
}

var HostsPage = new Page(Hosts.view(new Hosts.controller()));
var GroupsPage = new Page(Groups.view(new Groups.controller()));

m.route.mode = "search";
/* globals document */
m.route(document.body, "/hosts", {
    "/hosts": HostsPage,
    "/groups": GroupsPage,
});
