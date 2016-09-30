var Groups = function () {
};
Groups.list = m.prop([]);
Groups.picked = m.prop([]);
Groups.api = {
    first: false,
    next: false,
    previous: false,
    last: false,
    total: undefined,
    initial: true
};
Groups.replace = function (group) {
    var index = Groups.list().map(function (el) {
        return el.d.id();
    }).indexOf(group.d.id());
    Groups.list().splice(index, 1, group);
    Groups.store([], true);
    m.redraw();
    return group;
};
Groups.storage = mx.storage("Groups", mx.LOCAL_STORAGE);
Groups.store = function (value, add) {
    add = typeof add !== "undefined" ? add : false;
    if (value instanceof Array) {
        if (!add) {
            Groups.list(Groups.list().concat(value));
        }
        Groups.storage.set("groupsList", Groups.list());
        return Groups.list();
    }
    if (!value && localStorage.getItem("groupsList") !== null) {
        console.log("Fetching from localStorage");
        Groups.storage.get("groupsList").forEach(function (element) {
            Groups.list().push(new Group(element));
        });
        return true;
    }
};
Groups.getList = function (direction) {
    direction = typeof direction !== "undefined" ? direction : false;
    var base = "http://127.0.0.1:8000";
    var end = "/groups";
    if (Groups.api.total !== undefined && Groups.list().length === Groups.api.total) {
        return;
    }
    if (!direction) {
        if (Groups.store()) {
            m.redraw();
            return;
        }
    }
    var url = base + end;
    if (direction === "next") {
        if (!Groups.api.next) {
            return;
        }
        url = base + Groups.api.next;
    }
    if (direction === "previous") {
        if (!Groups.api.previous) {
            return;
        }
        url = base + Groups.api.previous;
    }
    if (direction === "last") {
        url = base + Groups.api.last;
    }
    console.log(url);
    console.log(Groups.api.total);
    console.log(Groups.list().length);
    m.request({
        method: "GET",
        url: url,
        background: true,
        initialValue: [],
        unwrapSuccess: function (response) {
            Groups.api.initial = false;
            Groups.api.next = response["hydra:nextPage"] || false;
            Groups.api.previous = response["hydra:previousPage"] || false;
            Groups.api.last = response["hydra:lastPage"];
            Groups.api.first = response["hydra:firstPage"];
            Groups.api.total = response["hydra:totalItems"];
            console.log(Groups.api.total);
            console.log(Groups.list().length);
            return response["hydra:member"];
        },
        type: Group
    }).then(log).then(Groups.store).then(m.redraw).then(function () {
        // while debugging other stuff disable this
        Groups.getList("next");
    });
};
Groups.pick = function (group) {
    var found = Groups.picked().some(function (el) {
        return el.d.id() === group.d.id();
    });
    if (!found) {
        // add to picked
        Groups.picked().push(group);
    } else {
        // remove from picked
        Groups.picked(Groups.picked().filter(function (el) {
            return el !== group;
        }));
    }
};
Groups.isPicked = function (group) {
    return Groups.picked().some(function (el) {
        return el.d.id() === group.d.id();
    });
};
Groups.vm = (function () {
    var vm = {};
    vm.init = function () {
        Groups.getList();
        vm.list = Groups.list;
    };
    vm.create = function () {
        Group.vm.create();
    };
    vm.listFilter = m.prop("");
    vm.pickButtons = m.prop("manual");
    vm.picked = function () {
        var toggle = vm.pickButtons();
        if (toggle !== "manual") {
            if (toggle === "none") {
                Groups.picked([]);
            }
            if (toggle === "all") {
                vm.list().forEach(function (host) {
                    Groups.pick(host);
                });
            }
            if (toggle === "inverse") {
                var newlist = Groups.list();
                Groups.picked().forEach(function (host) {
                    newlist = newlist.filter(function (el) {
                        return el !== host;
                    });
                });
                Groups.picked(newlist);
            }
            vm.pickButtons("manual");
        }
        return Groups.picked();
    };
    vm.pick = function (group) {
        vm.pickButtons("manual");
        Groups.pick(group);
    };
    vm.isPicked = function (group) {
        return Groups.isPicked(group);
    };
    vm.columns = (function() {
        var columns = {};
        columns.name = m.prop(true);

        return columns;
    })();
    return vm;
})();
Groups.controller = function () {
    var ctrl = this;
    ctrl.vm = Groups.vm;
    ctrl.vm.init();
};
Groups.view = function(ctrl) {
    return [
        m.component(Overview, {type:"Group", vm:ctrl.vm, nameObject:new Group(), singular:Group})//, {vm:ctrl.vm})
    ];
};
