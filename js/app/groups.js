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
Groups.add = function (group) {
    var found = Groups.list().some(function (el) {
        return el.d.id() === group.d.id();
    });
    if (!found) {
        Groups.list().push(group);
        Groups.store([], true);
    }
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
    var base = uiConfig.restUrl;
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
        user: uiConfig.user,
        password: uiConfig.password,
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
    };
    vm.create = function () {
        Group.vm.create();
    };
    vm.listFilter = m.prop("");
    vm.sortProp = m.prop("id");
    vm.list = function () {
        var list = [];
        if (vm.listFilter() === "") {
            list = Groups.list();
        }
        list = Groups.list().filter(function (group) {
            var searchable = [
                "name"
            ];
            var found = false;
            searchable.forEach(function (prop) {
                if (typeof group.d[prop]() === "string") {
                    if (group.d[prop]().toUpperCase().includes(vm.listFilter().toUpperCase())) {
                        found = true;
                    }
                }
            });
            return found;
        });

        return list.sort(function(a, b) {
            var prop = vm.sortProp();
            if (a instanceof Group || b instanceof Group) {
                return a.d[prop]() > b.d[prop]() ? 1 : a.d[prop]() < b.d[prop]() ? -1 : 0;
            }
            return a[prop]() > b[prop]() ? 1 : a[prop]() < b[prop]() ? -1 : 0;
        });
    };
    vm.pickButtons = m.prop("manual");
    vm.picked = function () {
        var toggle = vm.pickButtons();
        if (toggle !== "manual") {
            if (toggle === "none") {
                Groups.picked([]);
            }
            if (toggle === "all") {
                vm.list().forEach(function (group) {
                    Groups.pick(group);
                });
            }
            if (toggle === "inverse") {
                var newlist = Groups.list();
                Groups.picked().forEach(function (group) {
                    newlist = newlist.filter(function (el) {
                        return el !== group;
                    });
                });
                Groups.picked(newlist);
            }
            vm.pickButtons("manual");
        }
        return Groups.picked();
    };
    vm.pickedDo = function(option) {
        if (option === "enable") {
            Groups.picked().forEach(function (group) {
                group.d.enabled(true);
                Group.vm.save(group);
            });
        }
        if (option === "disable") {
            Groups.picked().forEach(function (group) {
                group.d.enabled(false);
                Group.vm.save(group);
            });
        }
    };
    vm.save = function(group) {
        Group.vm.save(group);
    }
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
    vm.pager = {};
    vm.pager.totalItems = function () {
        return vm.list() ? vm.list().length : 0;
    }.bind(vm.pager);
    vm.pager.currentPage = m.prop(0);
    vm.pager.itemsPerPage = function() {
        /* globals window */
        return parseInt((window.innerHeight - 165) / 33);
    };
    vm.pager.maxSize = 7;
    vm.pager.directionLinks = true;
    vm.pager.boundaryLinks = true;
    vm.pager.previousText = "<";
    vm.pager.nextText = ">";
    vm.pager.pagination = m.u.init(m.ui.pagination(vm.pager));
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
