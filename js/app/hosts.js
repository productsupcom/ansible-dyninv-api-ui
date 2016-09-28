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
        vm.pager.currentPage(0);
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
        columns.host = m.prop(true);
        columns.hostname = m.prop(true);
        columns.created = m.prop(true);
        columns.updated = m.prop(true);
        return columns;
    })();
    vm.showAllColumns = function () {
        Object.keys(vm.columns).forEach(function (column) {
            vm.columns[column](true);
        });
        m.redraw();
    };
    return vm;
})();
Hosts.controller = function () {
    var ctrl = this;
    ctrl.vm = Hosts.vm;
    ctrl.vm.init();
};
Hosts.view = function(ctrl) {
    return [
        m.component(Overview, {type:"Host", vm:ctrl.vm, nameObject:new Host(), singular:Host})//, {vm:ctrl.vm})
    ];
};
