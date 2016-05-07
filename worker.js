var plists;

var hcolor=[
    [  5,0x00ffff],
    [ 10,0x00ffcc],
    [ 15,0x00ff99],
    [ 20,0x00cc99],
    [ 25,0x009999],
    [ 35,0x009966],
    [ 40,0x009933],
    [ 45,0x006633],
    [ 50,0x006600],
    [ 55,0x009900],
    [ 60,0x00cc00],
    [ 65,0x00ff00],
    [ 70,0x33ff00],
    [ 80,0x66ff00],
    [ 90,0x99ff00],
    [100,0xccff00],
    [110,0xffff00],
    [120,0xffcc00],
    [130,0xff9900],
    [140,0xff6600],
    [150,0xff3300],
    [160,0xff0000],
    [170,0xcc0000],
    [180,0x990000],
    [190,0x660000],
    [200,0x330000],
    [10000,0x330000],
];

function heightcolor(h){
    for(var i=0;i < hcolor.length;i++){
        if(h<hcolor[i][0]) return {
            r:((hcolor[i][1]>>16)&0xff)/255.0,
            g:((hcolor[i][1]>> 8)&0xff)/255.0,
            b:((hcolor[i][1]>> 0)&0xff)/255.0,
        };
    }
    return {r:1,g:0,b:1};
}


function sub(a,b){
    return {
        x:a.x-b.x,
        y:a.y-b.y,
        z:a.z-b.z,
    };
}

function dot(a,b){
    return a.x*b.x+a.y*b.y;
}

function len(a) {
    return Math.sqrt(dot(a,a));
}

function min(a,b){
    return {
        x:Math.min(a.x,b.x),
        y:Math.min(a.y,b.y),
        z:Math.min(a.z,b.z),
    };
}

function max(a,b){
    return {
        x:Math.max(a.x,b.x),
        y:Math.max(a.y,b.y),
        z:Math.max(a.z,b.z),
    };
}

var LEVEL = 4;
var SIZE = 512;
var model=null;

function createModel(plists){

    var usize = plists.length;
    var vsize = plists.reduce(function(prev, current){
        return current.length>prev.length?current:prev;
    }).length;

    console.log("usize",usize);
    console.log("vsize",vsize);

    model = {
        nodes : [],
//        plists : plists,
        usize:usize,
        vsize:vsize,
    };

    function make_child(model,node,size,level){
        var step = Math.pow(2,level);
        for(var u = node.begin.u; u+step <node.end.u; u+=size){
            for(var v = node.begin.v; v+step <node.end.v; v+=size){
                var c = {
                    id:model.nodes.length,
                    begin:{
                        u:u,
                        v:v,
                    },
                    end:{
                        u:Math.min(usize,u+size+1),
                        v:Math.min(vsize,v+size+1),
                    },
                    level:level,
                    show:false,
                    mesh:null,
                    step:step,
                    children:[],
                    count:{
                        point:0,
                        line:0,
                        triangle:0,
                    },
                };
                node.children.push(c.id);
                model.nodes.push(c);
                if(level>0){
                    make_child(model,c,size/2,level-1);
                }
            }
        }
    }

    var root = {
        id:model.nodes.length,
        begin:{
            u:0,
            v:0,
        },
        end:{
            u:usize,
            v:vsize,
        },
        children:[],
    };
    model.nodes.push(root);
    make_child(model,root,SIZE,LEVEL);

    function calcMinMax(node){
        if(node.id>0){
            for(var u=node.begin.u;u <node.end.u;u+=node.step){
                for(var v=node.begin.v;v <node.end.v;v+=node.step){
                    var p=plists[u][v];
                    if(p){
                        node.count.point++;
                    }
                }
            }
        }
        if(node.children.length>0){
            node.children.forEach(function(id){
                var child = model.nodes[id];
                calcMinMax(child);
                if(child.min){
                    if(node.min){
                        node.min = min( node.min ,child.min );
                        node.max = max( node.max ,child.max );
                    }else{
                        node.min = child.min;
                        node.max = child.max;
                    }
                }
            })
        }else{
            for(var u=node.begin.u;u <node.end.u;u+=node.step){
                for(var v=node.begin.v;v <node.end.v;v+=node.step){
                    var p=plists[u][v];
                    if(p){
                        if(node.min){
                            node.min=min(node.min,p);
                            node.max=max(node.max,p);
                        }else{
                            node.min=p;
                            node.max=p;
                        }
                    }
                }
            }
        }
    }
    calcMinMax(model.nodes[0]);

    console.log("open model finish");
    console.log(new Date());
    postMessage({
        msg:"open",
        model:model,
    });
    model.plists=plists;
}

function open_file(file){

    function read(data){
        var lines = data.split("\n");
        var plist=null;
        var prev=null;
        var plists = [];
        lines.forEach(function(line){
            var p = line.split(",");
            if(p.length<3) return;
            p={x:1*p[1],y:1*p[2],z:1*p[3]};
            if(prev==null || prev.x > p.x){
                plist = [];
                plists.push(plist);
                if( plists.length>1 ){
                    var u = sub( plists[0][1], plists[0][0] );
                    var v = sub( p, plists[0][0]);;
                    var i = Math.round( dot(u,v)/dot(u,u) );
                    for(;i>0;i--){
                        plist.push(null);
                    }
                }
            }else{
                if(prev){
                    var u = sub(p,prev);
                    var d = len(u);
                    if(d>6){
                        d = Math.round(d/5.17)-1;
                        for(;d>0;d--){
                            plist.push(null);
                        }
                    }
                }
            }
            plist.push(p);
            prev = p;
        });
        createModel(plists);
    }
    
    if( typeof FileReader != "undefined" ){
        var reader = new FileReader();
        reader.onload = function (e) {
            read( e.target.result );
        }
        reader.readAsText(file);
    }else{
        var reader = new FileReaderSync();
        read( reader.readAsText(file) );
    }
    
}

function createBuffer(node,wireframe){

    if(wireframe){
        var positions=[];
        var indices_array=[];
        var colors=[];
        var idx=0;

        for(var u = node.begin.u; u <node.end.u; u+=node.step){
            var plist = model.plists[u];
            if(!plist) continue;
            var vsize = Math.ceil( (node.end.v-node.begin.v)/node.step );
            for(var v = node.begin.v; v <node.end.v; v+=node.step){
                var p = plist[v];
                if(p){
                    positions.push(p.x,p.y,p.z);
                    var c = heightcolor(p.z);
                    colors.push(c.r,c.g,c.b);
                    if(v+node.step < node.end.v && plist[v+node.step]) {
                        indices_array.push(idx,idx+1);
                    }
                    if(u+node.step < node.end.u && model.plists[u+node.step] && model.plists[u+node.step][v] ) {
                        indices_array.push(idx,idx+vsize);
                    }
                }else{
                    positions.push(0,0,0);
                    colors.push(1.0,1.0,1.0);
                }
                idx++;
            }
        }
        node.count.line = indices_array.length/2;
            
        var buffer = {
            index : new Uint16Array( indices_array ),
            position : new Float32Array( positions ),
            color : new Float32Array( colors )
        };
        
        postMessage({
            msg:"buffer",
            wireframe:true,
            node:node,
            buffer:buffer,
            count:node.count
        },[
            buffer.index.buffer,
            buffer.position.buffer,
            buffer.color.buffer
        ]);
    }else{
        var positions=[];
        var colors=[];

        for(var u = node.begin.u; u+node.step <node.end.u; u+=node.step){
            var plist0 = model.plists[u];
            var plist1 = model.plists[u+node.step];
            if(!plist0 || !plist1) continue;
            var vsize = Math.ceil( (node.end.v-node.begin.v)/node.step );
            for(var v = node.begin.v; v+node.step <node.end.v; v+=node.step){
                var p0 = plist0[v];
                var p1 = plist1[v+node.step];
                if(p0 && p1){
                    var q0 = plist1[v];
                    var q1 = plist0[v+node.step];

                    var cp0 = heightcolor(p0.z);
                    var cp1 = heightcolor(p1.z);
                    
                    if(q1){
                        var cq1 = heightcolor(q1.z);
                        positions.push(p0.x,p0.y,p0.z);
                        positions.push(p1.x,p1.y,p1.z);
                        positions.push(q1.x,q1.y,q1.z);
                        colors.push(cp0.r,cp0.g,cp0.b);
                        colors.push(cp1.r,cp1.g,cp1.b);
                        colors.push(cq1.r,cq1.g,cq1.b);
                    }
                    if(q0){
                        var cq0 = heightcolor(q0.z);
                        positions.push(p0.x,p0.y,p0.z);
                        positions.push(q0.x,q0.y,q0.z);
                        positions.push(p1.x,p1.y,p1.z);
                        colors.push(cp0.r,cp0.g,cp0.b);
                        colors.push(cq0.r,cq0.g,cq0.b);
                        colors.push(cp1.r,cp1.g,cp1.b);
                    }
                }
            }
        }
        node.count.triangle = positions.length/3;
        
        var buffer = {
            position : new Float32Array( positions ),
            color : new Float32Array( colors )
        };
        
        postMessage({
            msg:"buffer",
            wireframe:false,
            node:node,
            buffer:buffer,
            count:node.count
        },[
            buffer.position.buffer,
            buffer.color.buffer
        ]);
    }
}

onmessage=function(e){
    console.log("worker recv msg:"+e.data.msg);
    var msg = e.data.msg;
    var data = e.data.data;
    switch(msg){
        case "open":
            open_file(data);
            break;
        case "buffer":
            var buffer = createBuffer(data[0],data[1]);
            break;
    }
}