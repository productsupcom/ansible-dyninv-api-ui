var Group = function(data) {
    this.d = {};
    var d = this.d;

    d.id = data ? m.prop(data["@id"]) : m.prop("");
    d.name = data ? m.prop(data.name) : m.prop("");
    d.enabled = data ? m.prop(data.enabled) : m.prop("");
    d.variables = data ? m.prop(data.variables) : m.prop([]);
    if (d.variables == {}) {
        d.variables([]);
    }
    d.hosts_arr = data ? m.prop(data.hosts) : m.prop([]);
    d.hosts = function(){
        return Hosts.list().filter(function(el){
            return d.hosts_arr().indexOf(el.d.id());
        });
    }
}

Group.prototype.toJSON = function() {
    var d = this.d;
    var obj = {
        "@id": d.id(),
        "name": d.name(),
        "enabled": d.enabled(),
        "variables": d.variables(),
        "hosts": d.hosts()
    };
    console.log(obj);

    Object.keys(obj).map(function(property, index) {
        if (obj[property] === undefined || obj[property] == "") {
            delete obj[property];
        }
    });

    console.log(obj);

    return obj;
};
