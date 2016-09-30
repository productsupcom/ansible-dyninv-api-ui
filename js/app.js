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
menu.controller = function() {
};
menu.view = function(ctrl) {
    function btn(name, route) {
        var isCurrent = (m.route() == route);
        var click = function(){ m.route(route); };
        return m("li", {}, [
            m("a", {onclick: click, class: (isCurrent ? "active" : "")}, [name]),
        ]);
    }

    return m("nav", {class:"navbar navbar-default navbar-fixed-top"}, [
        m("div", {class: "container-fluid"}, [
            m("div", {id:"navbar"}, [
                m("ul", {class:"nav navbar-nav"}, [
                    btn("Hosts", "/hosts"),
                    btn("Groups", "/groups"),
                ]),
            ]),
        ]),
    ]);
};

function Page(page) {
    var p = this;
    p.view = function() {
        return [
            menu.view(new menu.controller()),
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
