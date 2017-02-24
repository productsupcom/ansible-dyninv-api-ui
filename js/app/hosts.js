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
        if (Hosts.list().length == Hosts.storage.get("hostsList").length) {
            return true;
        }
        console.log("Fetching Hosts from localStorage");
        Hosts.list([]);
        Hosts.storage.get("hostsList").forEach(function (element) {
            Hosts.list().push(new Host(element));
        });
        return true;
    }
};
Hosts.getList = function (direction) {
    if (Login.token() === null) {
        m.route("/login");
    }
    direction = typeof direction !== "undefined" ? direction : false;
    var base = uiConfig.restUrl;
    var end = "/hosts";
    if (Hosts.api.total !== undefined && Hosts.list().length === Hosts.api.total) {
        return;
    }
    if (!direction) {
        if (Hosts.store()) {
            //m.redraw();
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
    api.request({
        method: "GET",
        url: url,
        background: true,
        initialValue: [],
        unwrapSuccess: function (response) {
            console.log(response);
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
    }).catch(function(e){
        console.log(e.message);
    }).then(log)
    .then(Hosts.store)
    .then(m.redraw)
    .then(function () {
        // while debugging other stuff disable this
        Hosts.getList("next");
    });
};
Hosts.vm = (function () {
    var vm = {};
    vm.init = function () {
        Hosts.getList();
    };
    vm.listFilter = m.prop("");
    vm.sortIt = m.prop(false);
    vm.sortProp = m.prop("id");
    vm.list = function () {
        var list = [];
        if (vm.listFilter() === "") {
            list = Hosts.list();
        }
        list = Hosts.list().filter(function (host) {
            var searchable = [
                "ip",
                "domain",
                "fqdn",
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

        if (vm.sortIt()) {
            // for some reason it goes in here for 6-7x
            console.log("gonna sort", list[0].d.hostname());
            var first = list[0];
            list = list.sort(function(a, b) {
                var prop = vm.sortProp();
                if (a instanceof Host || b instanceof Host) {
                    return a.d[prop]() > b.d[prop]() ? 1 : a.d[prop]() < b.d[prop]() ? -1 : 0;
                }
                return a[prop]() > b[prop]() ? 1 : a[prop]() < b[prop]() ? -1 : 0;
            });
            if (first === list[0]) {
                list = list.reverse();
            }
            //vm.sortIt(false);
        }

        return list;
    };
    vm.picked = function () {
        var toggle = vm.pickButtons();
        if (toggle !== "manual") {
            if (toggle === "none") {
                Hosts.picked([]);
            }
            if (toggle === "all") {
                vm.list().forEach(function (host) {
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
    vm.pickedDo = function(option) {
        if (option === "enable") {
            Hosts.picked().forEach(function (host) {
                host.d.enabled(true);
                Host.vm.save(host);
            });
        }
        if (option === "disable") {
            Hosts.picked().forEach(function (host) {
                host.d.enabled(false);
                Host.vm.save(host);
            });
        }
        if (option === "addToGroup") {
            vm.openModal("sg");

        }
    };
    vm.save = function(host) {
        Host.vm.save(host);
    };
    vm.openModal = function(size) {
        vm.modalInstance = m.u.init(m.ui.modal({
            size: size,
            params: {
                vm: vm,
            },
            module: addToGroupModal,
            onopen: function () {
                // redraw first else it didn"t finish rendering the view yet
                m.redraw();
                vm.initGroupSelect();
            }
        }));
        vm.modalInstance.result.then(function () {
            vm.picked().forEach(function(host){
                vm.groupsToAdd().forEach(function(group){
                    Host.vm.addHostToGroup(host, group);
                    Host.vm.save(host);
                });
            });
        }, function () {
            console.log("Modal dismissed");
        });
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
    vm.create = function () {
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
    vm.pickButtons = m.prop("manual");
    vm.columns = (function () {
        var columns = {};
        columns.ip = m.prop(true);
        columns.domain = m.prop(true);
        columns.fqdn = m.prop(true);
        columns.hostname = m.prop(true);
        columns.created = m.prop(true);
        columns.updated = m.prop(true);
        columns.groupsCount = m.prop(true);
        return columns;
    })();
    vm.showAllColumns = function () {
        Object.keys(vm.columns).forEach(function (column) {
            vm.columns[column](true);
        });
        m.redraw();
    };
    vm.pager = {};
    vm.pager.totalItems = function () {
        return vm.list() ? vm.list().length : 0;
    }.bind(vm.pager);
    vm.pager.currentPage = m.prop(0);
    vm.pager.itemsPerPage = function() {
        /* globals window */
        return parseInt((window.innerHeight - 170) / 33);
    };
    vm.pager.maxSize = 7;
    vm.pager.directionLinks = true;
    vm.pager.boundaryLinks = true;
    vm.pager.previousText = "<";
    vm.pager.nextText = ">";
    vm.pager.pagination = m.u.init(m.ui.pagination(vm.pager));


    vm.groupsToAdd = m.prop([]);
    /* globals $ */
    vm.initGroupSelect = function () {
        var el = $("#addGroups");
        if (el.hasClass("select2-hidden-accessible")) {
            // redraw to reflect the change, else it can sometimes show the old one
            el.select2("destroy");
            m.redraw();
        }
        el.select2({width: "530px"});
        el.on("change", function () {
            m.startComputation();
            var groups = el.select2("val");
            // simply set the returned array as the new group list
            vm.groupsToAdd(groups);
            m.endComputation();
            m.redraw();
        });
    };

    return vm;
})();
Hosts.controller = function () {
    var ctrl = this;
    ctrl.vm = Hosts.vm;
    if (Login.token()) {
        ctrl.vm.init();
    }
};
Hosts.view = function(ctrl) {
    return [
        m.component(Overview, {type:"Host", vm:ctrl.vm, nameObject:new Host(), singular:Host})//, {vm:ctrl.vm})
    ];
};

var addToGroupModal = {};
addToGroupModal.controller = function (params) {
    var ctrl = this;
    ctrl.params = params;
    ctrl.list = Groups.list();
    ctrl.ok = function () {
        ctrl.$modal.close();
    };
    ctrl.cancel = function () {
        ctrl.$modal.dismiss("Cancel");
    };
};
addToGroupModal.view = function (ctrl) {
    var vm = ctrl.params.vm;
    var object = ctrl.params.object;
    return m("div", [
        m("div", { class: "modal-header" }, [m("h3", { class: "modal-title" }, ["Add Group(s)"])]),
        m("div", { class: "modal-body" }, [
            m("div", [m("select", {id: "addGroups", multiple: "multiple" }, [
                ctrl.list.map(function (el) {
                    return m("option", {
                        value: el.d.id(),
                    }, el.d.name());
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
    ]);
};
