var Overview = {
    controller: function(args, extras) {
        return {
            vm: args.vm,
            nameObject: args.nameObject,
            singular: args.singular,
            type: args.type,
        };
    },
    view: function(ctrl, args) {
        var vm = ctrl.vm;
        //vm.init();
        return m("table", {class:"table table-condensed table-striped table-hover"}, [
            // sorts() works with Hosts.list() because that is used by vm.list(), but since vm.list() is not a real array it currently is unable to sort
            // FIXME
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
                                header.push(m("th", {"data-sort-by":column.object, onclick: m.withAttr("data-sort-by", function(val) {
                                    vm.sortIt(true);
                                    vm.sortProp(val);
                                })}, column.name));
                            }
                        });
                        return header;
                    })()
                ])]),
                m("tbody", [vm.list().slice(vm.pager.itemsPerPage() * vm.pager.currentPage(), vm.pager.itemsPerPage() * (vm.pager.currentPage() + 1)).map(function (obj) {
                    return m("tr", {
                        class: (vm.isPicked(obj)) ? "success" : "",
                        onclick: function() {vm.pick(obj);}
                    }, [
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
                                onclick: function (e) {
                                    ctrl.singular.vm.edit(obj, true);
                                    e.stopImmediatePropagation();
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
                                        body.push(m("td", {
                                            ondblclick: function(e){
                                            obj.inplace(true);
                                            e.stopImmediatePropagation();
                                        }},
                                            (function(){
                                                if (column.inplace === true) {
                                                    return obj.inplace() ? m("input", {
                                                        value: obj.d[column.object](),
                                                        onclick: function(e){
                                                            e.stopImmediatePropagation();
                                                        },
                                                        onchange: m.withAttr("value", function(value) {
                                                            obj.inplace(false);
                                                            obj.d[column.object](value);
                                                            vm.save(obj);
                                                        })}) : obj.d[column.object]();
                                                } else {
                                                    return obj.d[column.object]();
                                                }
                                            }())
                                            //column.inplace() ? "bla" :
                                        ));
                                    }
                                }
                            });
                            return body;
                        })()
                    ]);
                })])
            ]);
    }
};
