var log = function(value) {
    if (value instanceof Array) {
        console.log('is an array');
    }
    console.log(value)
    return value
}

function sorts(list) {
    return {
        onclick: function(e) {
            var prop = e.target.getAttribute("data-sort-by")
            if (prop) {
                var first = list[0]
                list.sort(function(a, b) {
                    if (a instanceof Host || b instanceof Host) {
                        return a.d[prop]() > b.d[prop]() ? 1 : a.d[prop]() < b.d[prop]() ? -1 : 0
                    }
                    return a[prop]() > b[prop]() ? 1 : a[prop]() < b[prop]() ? -1 : 0
                })
                if (first === list[0]) list.reverse()
            }
        }
    }
}


var ansible = {};

ansible.controller = function() {
    var ctrl = this;

    ctrl.visible = m.prop('hosts');

    ctrl.list = new Hosts.controller();
    //ctrl.host = new Host.controller();
    ctrl.groupList = new Groups.controller();

    ctrl.activeView = function(){
        if (ctrl.visible() == 'hosts') {
            return Hosts.view(ctrl.list);
        }

        if (ctrl.visible() == 'groups') {
            return Groups.view(ctrl.groupList);
        }
    }
}

ansible.view = function(ctrl) {
    return [
    m("nav", {class:"navbar navbar-default navbar-fixed-top"}, [
        m("div", {class: "container-fluid"}, [
            m("div", {id:"navbar"}, [
                m("ul", {class:"nav navbar-nav"}, [
                    m("li", {}, [
                        m("a", {"data-visible":"hosts", onclick: m.withAttr("data-visible", ctrl.visible)}, ["Hosts"]),
                    ]),
                    m("li", {}, [
                        m("a", {"data-visible":"groups", onclick: m.withAttr("data-visible", ctrl.visible)}, ["Groups"]),
                    ]),
                ]),
            ]),
        ]),
    ]),
    m("div", {class:"container-fluid"}, [
        m("div", {class:"row-fluid"}, [
            m("div", {class:"col-md-12"}, [
                ctrl.activeView()
            ])
        ])
    ]),
    m("div", [
      Host.vm.modalInstance ? Host.vm.modalInstance.$view() : []
    ])
    ];
}

m.module(document.body, ansible);
//initialize the application
//m.mount(document.body, {controller: Hosts.controller, view: Hosts.view});
//m.mount(document.body, [
//    {controller: Hosts.controller, view: Hosts.view},
////    {controller: Host.controller, view: Host.view}
//]);
