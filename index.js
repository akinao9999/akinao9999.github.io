    //   window.jQuery = window.$ = require('../data/jquery-2.2.2.min.js');

var wireframe = false; 

var count={
    point:0,
    line:0,
    triangle:0,
};

var hcolor=[
    [  5,new THREE.Color(0x00ffff)],
    [ 10,new THREE.Color(0x00ffcc)],
    [ 15,new THREE.Color(0x00ff99)],
    [ 20,new THREE.Color(0x00cc99)],
    [ 25,new THREE.Color(0x009999)],
    [ 35,new THREE.Color(0x009966)],
    [ 40,new THREE.Color(0x009933)],
    [ 45,new THREE.Color(0x006633)],
    [ 50,new THREE.Color(0x006600)],
    [ 55,new THREE.Color(0x009900)],
    [ 60,new THREE.Color(0x00cc00)],
    [ 65,new THREE.Color(0x00ff00)],
    [ 70,new THREE.Color(0x33ff00)],
    [ 80,new THREE.Color(0x66ff00)],
    [ 90,new THREE.Color(0x99ff00)],
    [100,new THREE.Color(0xccff00)],
    [110,new THREE.Color(0xffff00)],
    [120,new THREE.Color(0xffcc00)],
    [130,new THREE.Color(0xff9900)],
    [140,new THREE.Color(0xff6600)],
    [150,new THREE.Color(0xff3300)],
    [160,new THREE.Color(0xff0000)],
    [170,new THREE.Color(0xcc0000)],
    [180,new THREE.Color(0x990000)],
    [190,new THREE.Color(0x660000)],
    [200,new THREE.Color(0x330000)],
    [10000,new THREE.Color(0x330000)],
];

function heightcolor(h){
    for(var i=0;i < hcolor.length;i++){
        if(h<hcolor[i][0]) return hcolor[i][1];
    }
    return hcolor[hcolor.length-1][1]
}

function releaseMesh(mesh)
{
    if( mesh.geometry ){
        mesh.geometry.dispose();
        mesh.geometry=null;
    }
    if( mesh.material ){
        mesh.material.dispose();
        mesh.material=null;
    }
}

function createMesh( plists, node )
{

    if(wireframe){
        var positions=[];
        var indices_array=[];
        var colors=[];
        var idx=0;

        var xsize = Math.min( node.size, plists.length-node.x-1 );
        for (var i=node.x; i <= node.x+xsize; i+=node.step){
            var plist = plists[i];
            if(plist==null) continue;
            var ysize = Math.min( node.size,plist.length-node.y-1 );
            for (var j=node.y; j <= node.y+ysize; j+=node.step){
                var p = plist[j];
                if(p){
                    positions.push(p[0],p[1],p[2]);
                    var c = heightcolor(p[2]);
                    colors.push(c.r,c.g,c.b);
                    if(j+node.step <= node.y + ysize && plist[j+node.step]  ) indices_array.push(idx,idx+1);
                    if(i+node.step <= node.x + xsize && plists[i+node.step] && plists[i+node.step][j] ) indices_array.push(idx,idx+Math.floor(ysize/node.step)+1);
                    // if( plist[j+node.step]  ) indices_array.push(idx,idx+1);
                    // if( plists[i+node.step] && plists[i+node.step][j] ) indices_array.push(idx,idx+(node.size/node.step)+1);
                }else{
                    positions.push(0,0,0);
                    colors.push(0.0,0.0,0.0);
                }
                idx++;
            }
        }
        
        if( positions.length==0 ) return null;

        var geometry = new THREE.BufferGeometry();
        geometry.setIndex( new THREE.BufferAttribute( new Uint16Array( indices_array ), 1 ) );
        geometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( positions ), 3 ) );
        geometry.addAttribute( 'color', new THREE.BufferAttribute( new Float32Array( colors ), 3 ) );
//        geometry.computeBoundingSphere();
        
        var material = new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors });
        var mesh = new THREE.LineSegments( geometry, material );
        return mesh;
    }else{

        var positions=[];
        var colors=[];

        var xsize = Math.min( node.size, plists.length-node.x-1 );
        for (var i=node.x; i+node.step <= node.x+xsize; i+=node.step){
            var plist0 = plists[i];
            var plist1 = plists[i+node.step];
            if(plist0 && plist1){
                
                var ysize = Math.min( node.size,plist0.length-node.y-1 );
                for (var j=node.y; j+node.step <= node.y+ysize; j+=node.step){
                    var p0 = plist0[j];
                    var p1 = plist1[j+node.step];
                    if(p0 && p1){
                        var q0 = plist0[j+node.step];
                        var q1 = plist1[j];

                        var cp0 = heightcolor(p0[2]);
                        var cp1 = heightcolor(p1[2]);

                        if(q1){
                            var cq1 = heightcolor(q1[2]);
                            positions.push(p0[0],p0[1],p0[2]);
                            positions.push(q1[0],q1[1],q1[2]);
                            positions.push(p1[0],p1[1],p1[2]);
                            colors.push(cp0.r,cp0.g,cp0.b);
                            colors.push(cq1.r,cq1.g,cq1.b);
                            colors.push(cp1.r,cp1.g,cp1.b);
                        }
                        if(q0){
                            var cq0 = heightcolor(q0[2]);
                            positions.push(p0[0],p0[1],p0[2]);
                            positions.push(p1[0],p1[1],p1[2]);
                            positions.push(q0[0],q0[1],q0[2]);
                            colors.push(cp0.r,cp0.g,cp0.b);
                            colors.push(cp1.r,cp1.g,cp1.b);
                            colors.push(cq0.r,cq0.g,cq0.b);
                        }

                    }
                }

                
            }
        }

        if( positions.length==0 ) return null;

        var geometry = new THREE.BufferGeometry();
        geometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( positions ), 3 ) );
        geometry.addAttribute( 'color', new THREE.BufferAttribute( new Float32Array( colors ), 3 ) );

        geometry.computeFaceNormals();

        var material = new THREE.MeshLambertMaterial({
            vertexColors: THREE.VertexColors,
            transparent: true, opacity: 0.8,
            side: THREE.FrontSide,
            wireframe:false });

        var mesh = new THREE.Mesh( geometry, material );
        return mesh;
    }

}

var scene=null;
var camera=null
var controls=null;
var model=null;
var worker=null;

function createScene(){
    
  // (1) scece 
  scene = new THREE.Scene();//  this.scene= scene;

  // (2) Light
  
  var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(-500, 300, 200);
  scene.add(directionalLight); 

  var ambientLight = new THREE.AmbientLight(0xcccccc);
  scene.add(ambientLight); 
  
  // (3) Camera 
  
  camera = new THREE.PerspectiveCamera(45, 600 / 400, 1, 19600);
  
  camera.up.x = 0;
  camera.up.y = 0;
  camera.up.z = 1;
  camera.position.set(0, 900, 900); //  this.camera = camera;
  camera.lookAt(new THREE.Vector3(0,0,0));

  // 描画

  // 床の描画

  var ruler = new THREE.Object3D();
  
  var grid = new THREE.GridHelper(500, 10);
  grid.rotation.x = Math.PI/2;
  grid.position.z += - 10;
  grid.position.x = 0;
  grid.position.y = 0;
  grid.setColors( new THREE.Color(0x333333), new THREE.Color(0x333333));
  ruler.add(grid);
  
  // 座標軸および原点の描画
  var o = this.origin;
  var geometry = new THREE.Geometry();
  geometry.vertices.push(new THREE.Vector3(0,  0,  0));
  geometry.vertices.push(new THREE.Vector3(0,  50, 0));
  var material = new THREE.LineBasicMaterial({color: 'red', linewidth: 2});
  pollx = new THREE.Line(geometry, material);
  ruler.add(pollx);

  var geometry = new THREE.Geometry();
  geometry.vertices.push(new THREE.Vector3(0,  0, 0));
  geometry.vertices.push(new THREE.Vector3(50, 0, 0));
  var material = new THREE.LineBasicMaterial({color: 'green', linewidth: 2});
  polly = new THREE.Line(geometry, material);
  ruler.add(polly);
  
  var geometry = new THREE.Geometry();
  geometry.vertices.push(new THREE.Vector3(0, 0,  0));
  geometry.vertices.push(new THREE.Vector3(0, 0, 50));
  var material = new THREE.LineBasicMaterial({color: 'blue', linewidth: 2});
  pollz = new THREE.Line(geometry, material);
  ruler.add(pollz);

  scene.add(ruler);

  // (5) WebGL Renderer

  

  renderer = new THREE.WebGLRenderer();
  
  renderer.setSize(window.innerWidth,window.innerHeight);
  renderer.clear(true);
  
  first = document.getElementById("canvas").firstChild;
  if(first){
    document.getElementById("canvas").removeChild(first);
  }
  document.getElementById("canvas").appendChild(renderer.domElement);
  
  
  controls = new THREE.OrbitControls(camera, renderer.domElement);

  initWorker();

  function render(){
    requestAnimationFrame(render);
    controls.update();
    updateScene();
    renderer.render(scene, camera);
  }
  render();  

}

function updateScene(){

    function hideNode(node,q){
        if( node.show ){
            q.push(node);
            node.show = false;
        }
        else if( node.children!=null ){
            node.children.forEach(function(id){
                var child = model.nodes[id];
                hideNode(child,q);
            });
        }
    }
    
    function checkNode(node,q){
        var l = lod(node,camera.position);
        if( l < node.level){
            // 子供を表示
            if(node.show){
                q.push(node);
                node.show = false;
            }
            node.children.forEach(function(id){
                var child=model.nodes[id];
                checkNode(child,q);
            });
        }else if(l <99){
            // 表示
            if(!node.show){
                q.unshift(node);
                node.show = true;
                node.children.forEach(function(id){
                    var child=model.nodes[id];
                    hideNode(child,q);
                });
            }
        }else{
            // 非表示
            hideNode(node,q);
        }
    }

    function updateMesh(root,q){
        q.forEach(function(node){
            if(node.show){
                if(!node.mesh){
                    sendMessage("buffer",[node,wireframe]);
                }
                else if( node.mesh ){
                    scene.add(node.mesh);
                }
            }else{
                hideMesh(node);
//                 if(node.mesh){
//                     scene.remove(node.mesh);
// //                    releaseMesh(node.mesh);
// //                    node.mesh=null;
//                 }
            }
        });
    }

    if(model){
        model.nodes[0].children.forEach(function(id){
            var node = model.nodes[id];
            var q=[];
            checkNode(node,q);
            if(q.length>0){
                updateMesh(node,q);
            }
        });
    }

}


var lod_range=500;
function lod(node,pos){

    if(!node.min || !node.max) return 99;

    var nx = pos.x;
    var ny = pos.y;
    var nz = pos.z;
    
    if(nx < node.min.x){
        nx = node.min.x;
    }
    if(nx > node.max.x){
        nx = node.max.x;
    }
    if(ny < node.min.y){
        ny = node.min.y;
    }
    if(ny > node.max.y){
        ny = node.max.y;
    }
    if(nz < node.min.z){
        nz = node.min.z;
    }
    if(nz > node.max.z){
        nz = node.max.z;
    }
    
    var dx = pos.x-nx;
    var dy = pos.y-ny;
    var dz = pos.z-nz;
    var dd = Math.sqrt(dx*dx+dy*dy+dz*dz);
    if( dd < lod_range ){
        return 0;
    }else if( dd < lod_range*2 ){
        return 1;
    }else if( dd < lod_range*4 ){
        return 2;
    }else if( dd < lod_range*8 ){
        return 3;
    }else{
        return 4;
    }
}

function loadModel(){
    
  function make_children(node){
    for(var x=0; x <2; x++){
    for(var y=0; y <2; y++){
        var hsize = node.size/2;
        var child = {
            level:node.level-1,
            show:false,
            mesh:null,
            children:[],
            min:[],
            max:[],
            center:[],
            x:node.x+x*hsize,
            y:node.y+y*hsize,
            size:hsize,
            step:node.step/2,
        };
        child.min[0] = node.min[0] + x*(node.max[0]-node.min[0])/2;
        child.min[1] = node.min[1] + y*(node.max[1]-node.min[1])/2;
        child.min[2] = node.min[2];
        
        child.max[0] = node.max[0] - (1-x)*(node.max[0]-node.min[0])/2;
        child.max[1] = node.max[1] - (1-y)*(node.max[1]-node.min[1])/2;
        child.max[2] = node.max[2];
        
        child.center[0] = ( child.max[0] + child.min[0] )/2;
        child.center[1] = ( child.max[1] + child.min[1] )/2;
        child.center[2] = ( child.max[2] + child.min[2] )/2;
        
        node.children.push(child);
        if(child.level>0){
            make_children(child);
        }
    }
    }
  }

console.log("data");
    $.getJSON("data/kitsuki5m_tree.json",function(data){
console.log("data");
        for(var i=0;i<data.length;i++){
            var node = data[i];
            node.level = 4;
            node.show=false;
            node.mesh=null;
            node.vertex=null;
            node.loading=false;
            node.center=[];
            node.x=0;
            node.y=0;
            node.step=Math.pow(2,node.level);
            node.children=[];

            node.center[0] = ( node.max[0] + node.min[0] )/2;
            node.center[1] = ( node.max[1] + node.min[1] )/2;
            node.center[2] = ( node.max[2] + node.min[2] )/2;
            make_children(node);
        }
        controls.target = new THREE.Vector3(data[0].center[0],data[0].center[1],data[0].center[2]);
        camera.position.copy(controls.target).add( new THREE.Vector3(0, 900, 900) ); //  this.camera = camera;

        model = {
            nodes : data
        };
    });
}

window.addEventListener('resize', function() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      }, false );

function hideMesh(node){
    node.show=false;
    if(node.mesh){
        scene.remove(node.mesh);
        node.mesh=null;
        count.point -= node.count.point;
        count.line -= node.count.line;
        count.triangle -= node.count.triangle;
        node.count={
            point:0,
            line:0,
            triangle:0,
        };
        updateCount();
    }
}

function hideAllMesh(){
    if(model && model.nodes){
        model.nodes.forEach(function(node){
            hideMesh(node);
        });
    }
}

function check(){
    wireframe = window.event.target.checked;
    hideAllMesh();
}

function updateCount()
{
    $("#count_point").text(count.point);
    $("#count_line").text(count.line);
    $("#count_triangle").text(count.triangle);
}

function open_file(e){
    sendMessage("open",window.data_file.files[0]);
}

function initWorker(){
    worker = new Worker("worker.js");
    worker.addEventListener("message",function(e){
        console.log("recv msg:"+e.data.msg);
        switch(e.data.msg){
            case "open":
                model = e.data.model;
                var cx = (model.nodes[0].min.x + model.nodes[0].max.x)/2;
                var cy = (model.nodes[0].min.y + model.nodes[0].max.y)/2;
                var cz = (model.nodes[0].min.z + model.nodes[0].max.z)/2;
                controls.target = new THREE.Vector3(cx,cy,cz);
                camera.position.copy(controls.target).add( new THREE.Vector3(0, 900, 900) ); //  this.camera = camera;
                
                break;
            case "buffer":
                var node = model.nodes[e.data.node.id];
                if(!node.mesh){
                    if(node.show){
                        if(e.data.count.point==0){
                            throw "ERR";
                        }
                        if(wireframe && e.data.wireframe){
                            var geometry = new THREE.BufferGeometry();
                            geometry.setIndex( new THREE.BufferAttribute( e.data.buffer.index, 1 ) );
                            geometry.addAttribute( 'position', new THREE.BufferAttribute( e.data.buffer.position, 3 ) );
                            geometry.addAttribute( 'color', new THREE.BufferAttribute( e.data.buffer.color, 3 ) );
                            var material = new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors });
                            node.mesh = new THREE.LineSegments( geometry, material );
                            scene.add(node.mesh);
                            node.count={
                                point:e.data.count.point,
                                line:e.data.count.line,
                                triangle:0,
                            };
                            count.point += node.count.point;
                            count.line += node.count.line;
                            count.triangle += node.count.triangle;
                        }
                        if(!wireframe && !e.data.wireframe){
                            var geometry = new THREE.BufferGeometry();
                            geometry.addAttribute( 'position', new THREE.BufferAttribute( e.data.buffer.position, 3 ) );
                            geometry.addAttribute( 'color', new THREE.BufferAttribute( e.data.buffer.color, 3 ) );
                            geometry.computeFaceNormals();
                            var material = new THREE.MeshLambertMaterial({
                                vertexColors: THREE.VertexColors,
                                transparent: true, opacity: 0.8,
                                side: THREE.FrontSide,
                                wireframe:false });
                            node.mesh = new THREE.Mesh( geometry, material );
                            scene.add(node.mesh);
                            node.count={
                                point:e.data.count.point,
                                line:0,
                                triangle:e.data.count.triangle,
                            };
                            count.point += node.count.point;
                            count.line += node.count.line;
                            count.triangle += node.count.triangle;
                        }
                        updateCount();
                    }
                }
                break;
        }
    });
}


function sendMessage(msg,data){
    worker.postMessage({
        msg:msg,
        data:data
    });
}

$(function(){
    $(window).resize(function() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    });

    wireframe = true;
    $("#wireframe").prop("checked",wireframe);
    $("#wireframe").change(function(e){
        console.log(e);
        wireframe = $("#wireframe").prop("checked");
        hideAllMesh();
    });

    lod_range = 500;
    $("#lod_range").val(500);
    $("#lod_range").on('input',function(e){
        lod_range = $("#lod_range").val();
        console.log(lod_range);
    });

});
