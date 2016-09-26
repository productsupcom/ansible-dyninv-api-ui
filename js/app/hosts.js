var Hosts = function () {
};
Hosts.list = m.prop([]);
Hosts.picked = m.prop([]);
Hosts.api = {
    first: false,
    next: false,
    previous: false,
    last: false,
    total: undefined,
    initial: true
};
Hosts.replace = function (host) {
    var index = Hosts.list().map(function (el) {
        return el.d.id();
    }).indexOf(host.d.id());
    Hosts.list().splice(index, 1, host);
    Hosts.store([], true);
    m.redraw();
    return host;
};
Hosts.add = function (host) {
    var found = Hosts.list().some(function (el) {
        return el.d.id() === host.d.id();
    });
    if (!found) {
        Hosts.list().push(host);
        Hosts.store([], true);
    }
    m.redraw();
    return host;
};
Hosts.pick = function (host) {
    var found = Hosts.picked().some(function (el) {
        return el.d.id() === host.d.id();
    });
    if (!found) {
        // add to picked
        Hosts.picked().push(host);
    } else {
        // remove from picked
        Hosts.picked(Hosts.picked().filter(function (el) {
            return el !== host;
        }));
    }
};
Hosts.isPicked = function (host) {
    return Hosts.picked().some(function (el) {
        return el.d.id() === host.d.id();
    });
};
Hosts.storage = mx.storage("Hosts", mx.LOCAL_STORAGE);
Hosts.store = function (value, add) {
    add = typeof add !== "undefined" ? add : false;
    if (value instanceof Array) {
        if (!add) {
            Hosts.list(Hosts.list().concat(value));
        }
        Hosts.storage.set("hostsList", Hosts.list());
        return Hosts.list();
    }
    if (!value && localStorage.getItem("hostsList") !== null) {
        console.log("Fetching from localStorage");
        Hosts.storage.get("hostsList").forEach(function (element) {
            Hosts.list().push(new Host(element));
        });
        return true;
    }
};
Hosts.getList = function (direction) {
    direction = typeof direction !== "undefined" ? direction : false;
    var base = "http://127.0.0.1:8000";
    var end = "/hosts";
    if (Hosts.api.total !== undefined && Hosts.list().length === Hosts.api.total) {
        return;
    }
    if (!direction) {
        if (Hosts.store()) {
            m.redraw();
            return;
        }
    }
    var url = base + end;
    if (direction === "next") {
        if (!Hosts.api.next) {
            return;
        }
        url = base + Hosts.api.next;
    }
    if (direction === "previous") {
        if (!Hosts.api.previous) {
            return;
        }
        url = base + Hosts.api.previous;
    }
    if (direction === "last") {
        url = base + Hosts.api.last;
    }
    console.log(url);
    console.log(Hosts.api.total);
    console.log(Hosts.list().length);
    m.request({
        method: "GET",
        url: url,
        background: true,
        initialValue: [],
        unwrapSuccess: function (response) {
            Hosts.api.initial = false;
            Hosts.api.next = response["hydra:nextPage"] || false;
            Hosts.api.previous = response["hydra:previousPage"] || false;
            Hosts.api.last = response["hydra:lastPage"];
            Hosts.api.first = response["hydra:firstPage"];
            Hosts.api.total = response["hydra:totalItems"];
            console.log(Hosts.api.total);
            console.log(Hosts.list().length);
            return response["hydra:member"];
        },
        type: Host
    }).then(log).then(Hosts.store).then(m.redraw).then(function () {
        // while debugging other stuff disable this
        Hosts.getList("next");
    });
};
Hosts.vm = (function () {
    var vm = {};
    vm.init = function () {
        Hosts.getList();    //vm.list = Hosts.list;
    };
    vm.listFilter = m.prop("");
    vm.list = function () {
        if (vm.listFilter() === "") {
            return Hosts.list();
        }
        Hosts.vm.pager.currentPage(0);
        return Hosts.list().filter(function (host) {
            var searchable = [
                "ip",
                "domain",
                "host",
                "hostname",
                "created",
                "updated"
            ];
            var found = false;
            searchable.forEach(function (prop) {
                if (typeof host.d[prop]() === "string") {
                    if (host.d[prop]().toUpperCase().includes(vm.listFilter().toUpperCase())) {
                        found = true;
                    }
                }
            });
            return found;
        });
    };
    vm.picked = function () {
        var toggle = vm.pickButtons();
        if (toggle !== "manual") {
            if (toggle === "none") {
                Hosts.picked([]);
            }
            if (toggle === "all") {
                Hosts.vm.list().forEach(function (host) {
                    Hosts.pick(host);
                });
            }
            if (toggle === "inverse") {
                var newlist = Hosts.list();
                Hosts.picked().forEach(function (host) {
                    newlist = newlist.filter(function (el) {
                        return el !== host;
                    });
                });
                Hosts.picked(newlist);
            }
            vm.pickButtons("manual");
        }
        return Hosts.picked();
    };
    vm.next = function () {
        Hosts.getList("next");
    };
    vm.previous = function () {
        Hosts.getList("previous");
    };
    vm.last = function () {
        Hosts.getList("last");
    };
    vm.first = function () {
        Hosts.getList("first");
    };
    vm.createHost = function () {
        Host.vm.create();
    };
    vm.edit = function (host) {
        Host.vm.edit(host, true);
    };
    vm.pick = function (host) {
        vm.pickButtons("manual");
        Hosts.pick(host);
    };
    vm.isPicked = function (host) {
        return Hosts.isPicked(host);
    };
    vm.update = function (data) {
        Host.vm.update(data);
    };
    vm.pager = {};
    // pagination needed things
    //var pagination = m.prop({});
    vm.pager.totalItems = function () {
        return vm.list() ? vm.list().length : 0;
    }.bind(vm.pager);
    vm.pager.currentPage = m.prop(0);
    vm.pager.itemsPerPage = m.prop(25);
    vm.pager.maxSize = 7;
    vm.pager.directionLinks = true;
    vm.pager.boundaryLinks = true;
    vm.pager.previousText = "<";
    vm.pager.nextText = ">";
    vm.pager.pagination = m.u.init(m.ui.pagination(vm.pager));
    vm.pickButtons = m.prop("manual");
    vm.columns = (function () {
        var columns = {};
        columns.ip = m.prop(true);
        columns.domain = m.prop(true);
        columns.host = m.prop(true);
        columns.hostname = m.prop(true);
        columns.created = m.prop(true);
        columns.updated = m.prop(true);
        return columns;
    })();
    vm.showAllColumns = function () {
        Object.keys(Hosts.vm.columns).forEach(function (column) {
            vm.columns[column](true);
        });
        m.redraw();
    };
    return vm;
})();
Hosts.controller = function () {
    var vm = Hosts.vm;
    vm.init();
};
Hosts.view = function () {
    return m("div", { class: "panel panel-default" }, [
        m("div", { class: "panel-heading" }, [m("h3", { class: "panel-title" }, "Available Hosts")]),
        m("div", { class: "panel-body" }, [
            m("button", {
                class: "btn btn-default",
                onclick: m.withAttr("data-id", function () {
                    Hosts.vm.createHost();
                })
            }, "New Host"),
            m("div", [Hosts.vm.pager.pagination.$view()]),
            m("div", { class: "btn-group" }, [
                m("button", {
                    class: "btn btn-default",
                    config: m.ui.configRadio(Hosts.vm.pickButtons, "none")
                }, ["None"]),
                m("button", {
                    class: "btn btn-default",
                    config: m.ui.configRadio(Hosts.vm.pickButtons, "inverse")
                }, ["Inverse"]),
                m("button", {
                    class: "btn btn-default",
                    config: m.ui.configRadio(Hosts.vm.pickButtons, "all")
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
                    m("li", [m("a", { onclick: Hosts.vm.showAllColumns }, ["Show all Columns"])]),
                    (function () {
                        var cols = [];
                        Object.keys(Hosts.vm.columns).forEach(function (column) {
                            cols.push(m("li", [m("a", [m("label[for=colShow" + column + "]", [m("input[id=colShow" + column + "],[type=checkbox]", {
                                            onchange: m.withAttr("checked", Hosts.vm.columns[column]),
                                            checked: Hosts.vm.columns[column]()
                                        })], column)])]));
                        });
                        return cols;
                    })(),
                    m("li", { class: "divider" }),
                    m("li", [
                        m("label[for=itemsPerPage]", "Items per Page"),
                        m("input[id=itemsPerPage],[type=number],[step=10]", {
                            onchange: m.withAttr("value", Hosts.vm.pager.itemsPerPage),
                            value: Hosts.vm.pager.itemsPerPage()
                        })
                    ])
                ])
            ])
        ]),
        m("div", {}, "Hosts selected: ", Hosts.vm.picked().length),
        m("label[for=listFilter]", "Search"),
        m("input[id=listFilter]", {
            onchange: m.withAttr("value", Hosts.vm.listFilter),
            value: Hosts.vm.listFilter()
        }),
        m("table[class=table table-condensed table-striped table-hover]", sorts(Hosts.list()), [
            m("thead", [m("tr", [
                    m("th", {}, "Pick"),
                    m("th", {}, "Options"),
                    (function () {
                        var header = [];
                        header.push(Hosts.vm.columns.ip() ? m("th[data-sort-by=ip]", {}, "IP") : undefined);
                        header.push(Hosts.vm.columns.domain() ? m("th[data-sort-by=domain]", {}, "Domain") : undefined);
                        header.push(Hosts.vm.columns.host() ? m("th[data-sort-by=host]", {}, "Host") : undefined);
                        header.push(Hosts.vm.columns.hostname() ? m("th[data-sort-by=hostname]", {}, "Hostname") : undefined);
                        header.push(Hosts.vm.columns.created() ? m("th[data-sort-by=created]", {}, "Created") : undefined);
                        header.push(Hosts.vm.columns.updated() ? m("th[data-sort-by=updated]", {}, "Updated") : undefined);
                        return header;
                    })()
                ])]),
            m("tbody", [Hosts.vm.list().slice(Hosts.vm.pager.itemsPerPage() * Hosts.vm.pager.currentPage(), Hosts.vm.pager.itemsPerPage() * (Hosts.vm.pager.currentPage() + 1)).map(function (host) {
                    return m("tr", {}, [
                        m("td", {}, m("input[type=checkbox]", {
                            onclick: function (e) {
                                Hosts.vm.pick(host);
                                e.stopImmediatePropagation();
                            },
                            checked: Hosts.vm.isPicked(host)
                        })),
                        m("td", {}, [
                            m("button", {
                                onclick: function () {
                                    Host.vm.edit(host, true);
                                },
                                class: "btn btn-default btn-xs"
                            }, [m("span", { class: "glyphicon glyphicon-pencil" })]),
                            Host.vm.enableButton(host)
                        ]),
                        (function () {
                            var body = [];
                            body.push(Hosts.vm.columns.ip() ? m("td", {}, host.d.ip()) : undefined);
                            body.push(Hosts.vm.columns.domain() ? m("td", {}, host.d.domain()) : undefined);
                            body.push(Hosts.vm.columns.host() ? m("td", {}, host.d.host()) : undefined);
                            body.push(Hosts.vm.columns.hostname() ? m("td", {}, host.d.hostname()) : undefined);
                            /* globals dateFormat */
                            body.push(Hosts.vm.columns.created() ? m("td", {}, dateFormat(Date.parse(host.d.created()))) : undefined);
                            body.push(Hosts.vm.columns.updated() ? m("td", {}, dateFormat(Date.parse(host.d.updated()))) : undefined);
                            return body;
                        })()
                    ]);
                })])
        ])
    ]);
};
