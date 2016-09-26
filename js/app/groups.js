var Groups = function () {
};
Groups.list = m.prop([]);
Groups.api = {
    first: false,
    next: false,
    previous: false,
    last: false,
    total: undefined,
    initial: true
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
Groups.vm = (function () {
    var vm = {};
    vm.init = function () {
        Groups.getList();
        vm.list = Groups.list;
    };
    return vm;
})();
Groups.controller = function () {
    Groups.vm.init();
};
Groups.view = function () {
    return m("div[class=panel panel-default]", [
        m("div[class=panel-heading]", [m("h3[class=panel-title", "Available Groups")]),
        m("div[class=panel-body]", []),
        m("table[class=table table-condensed table-striped table-hover]", sorts(Groups.list()), [
            m("thead", [m("tr", [m("th[data-sort-by=name]", {}, "Name")])]),
            m("tbody", [Groups.vm.list().map(function (group) {
                    return m("tr[data-id=" + group.d.id() + "]", {
                        class: group === Groups.vm.group ? "success" : "",
                        onclick: m.withAttr("data-id", function () {
                            Groups.vm.edit(group);
                        })
                    }, [m("td", {}, group.d.name())]);
                })])
        ])
    ]);
};
