package com.partkart
{
   import com.tink.display.HitTest;
   import flash.display.*;
   import flash.events.*;
   import flash.geom.Matrix;
   import flash.geom.Point;
   import flash.geom.Rectangle;
   import flash.text.*;
   
   public class SceneGraph extends Sprite
   {
      
      private static var singleton:SceneGraph;
      
      public var pathlist:Array = new Array();
      
      public var copylist:Array = new Array();
      
      public var cutlist:Array = new Array();
      
      public var xstart:Number = 0;
      
      public var ystart:Number = 0;
      
      public var ctrl:Boolean = false;
      
      private var progressdialog:ProgressDialog;
      
      public var nestpath:Path = null;
      
      private var nest:Nest = null;
      
      public var processlist:Array;
      
      public function SceneGraph(caller:Function = null)
      {
         super();
         if(caller != SceneGraph.getInstance)
         {
            throw new Error("SceneGraph is a singleton class, use getInstance() instead");
         }
         if(SceneGraph.singleton != null)
         {
            throw new Error("Only one Singleton instance should be instantiated");
         }
         this.cacheAsBitmap = true;
      }
      
      public static function getInstance() : SceneGraph
      {
         if(singleton == null)
         {
            singleton = new SceneGraph(arguments.callee);
         }
         return singleton;
      }
      
      public function addPath(p:Path) : void
      {
         addChild(p);
         p.render();
         this.pathlist.push(p);
         p.addEventListener(MouseEvent.MOUSE_DOWN,this.pathMouseDown);
      }
      
      public function removePath(p:Path) : Boolean
      {
         if(Boolean(p) && contains(p))
         {
            removeChild(p);
         }
         var index:int = this.pathlist.indexOf(p);
         if(index == -1)
         {
            return false;
         }
         this.pathlist.splice(index,1);
         return true;
      }
      
      public function addPaths(list:Array) : void
      {
         for(var i:int = 0; i < list.length; i++)
         {
            addChild(list[i]);
            this.pathlist.push(list[i]);
            list[i].addEventListener(MouseEvent.MOUSE_DOWN,this.pathMouseDown);
         }
         for(i = 0; i < list.length; i++)
         {
            list[i].setActive();
         }
      }
      
      public function setInactive() : void
      {
         for(var i:int = 0; i < this.pathlist.length; i++)
         {
            this.pathlist[i].setInactive();
         }
         for(i = 0; i < this.cutlist.length; i++)
         {
            this.cutlist[i].setInactive();
         }
      }
      
      public function getActiveCuts() : Array
      {
         var active:Array = new Array();
         for(var i:int = 0; i < this.cutlist.length; i++)
         {
            if(this.cutlist[i].active == true)
            {
               active.push(this.cutlist[i]);
            }
         }
         return active;
      }
      
      public function clearDots(p:Path = null) : void
      {
         for(var i:int = 0; i < this.pathlist.length; i++)
         {
            if(p == null || p != null && this.pathlist[i] != p)
            {
               this.pathlist[i].setSegmentsInactive();
               this.pathlist[i].setDotsInactive();
               this.pathlist[i].clearDots();
            }
         }
         var removelist:Array = new Array();
         for(i = 0; i < numChildren; i++)
         {
            if(getChildAt(i) is coordinates && (p == null || p != null && p.coord != getChildAt(i)))
            {
               removelist.push(getChildAt(i));
            }
         }
         for(i = 0; i < removelist.length; i++)
         {
            removeChild(removelist[i]);
         }
      }
      
      public function addDots() : void
      {
         var path:Path = null;
         for each(path in this.pathlist)
         {
            path.redrawDots();
         }
      }
      
      public function redraw() : void
      {
         var cut:CutObject = null;
         var path:* = undefined;
         trace("redraw!");
         if(Global.tool != 99)
         {
            this.clearDots();
            x = Global.xorigin;
            y = Global.yorigin;
            while(numChildren > 0)
            {
               removeChildAt(0);
            }
            for each(cut in this.cutlist)
            {
               addChild(cut);
            }
            for each(path in this.pathlist)
            {
               addChild(path);
               path.x = path.docx * Global.zoom;
               path.y = path.docy * Global.zoom;
               path.redraw();
            }
            this.redrawCuts();
         }
      }
      
      public function redrawCuts() : void
      {
         var cutobject:CutObject = null;
         var path:Path = null;
         for each(cutobject in this.cutlist)
         {
            cutobject.x = cutobject.docx * Global.zoom;
            cutobject.y = cutobject.docy * Global.zoom;
            cutobject.redraw();
         }
         for each(cutobject in this.cutlist)
         {
            if(cutobject.processed == false)
            {
               for each(path in cutobject.pathlist)
               {
                  path.dirty = false;
               }
            }
         }
      }
      
      public function cmToInch() : void
      {
         for(var i:int = 0; i < this.pathlist.length; i++)
         {
            this.pathlist[i].cmToInch();
            this.pathlist[i].dirty = true;
         }
         for(i = 0; i < this.cutlist.length; i++)
         {
            if(this.cutlist[i].processed == true)
            {
               this.cutlist[i].cmToInch();
            }
            else
            {
               this.cutlist[i].paramsCmToInch();
            }
         }
         Global.tolerance /= 2.54;
      }
      
      public function inchToCm() : void
      {
         for(var i:int = 0; i < this.pathlist.length; i++)
         {
            this.pathlist[i].inchToCm();
            this.pathlist[i].dirty = true;
         }
         for(i = 0; i < this.cutlist.length; i++)
         {
            if(this.cutlist[i].processed == true)
            {
               this.cutlist[i].inchToCm();
            }
            else
            {
               this.cutlist[i].paramsInchToCm();
            }
         }
         Global.tolerance *= 2.54;
      }
      
      public function pathMouseDown(e:MouseEvent) : void
      {
         var path:Path = null;
         var i:int = 0;
         var parents:Array = null;
         var movecut:Boolean = false;
         var p:Path = null;
         stage.focus = null;
         if(Global.tool == 3 && Global.space == false)
         {
            e.stopPropagation();
         }
         else if(Global.tool == 0 && Global.space == false)
         {
            e.stopPropagation();
            if(e.target is Segment)
            {
               path = e.target.parent as Path;
            }
            else if(e.target is Path)
            {
               path = e.target as Path;
            }
            if(path != null)
            {
               path.startDrag();
               path.dragging = true;
               path.mouseChildren = false;
               this.xstart = e.stageX;
               this.ystart = e.stageY;
               addChild(path);
               if(this.ctrl == true)
               {
                  if(path.active)
                  {
                     path.setInactive();
                  }
                  else
                  {
                     path.setActive();
                  }
               }
               else if(path.active == false || this.getPathNumActive() < 2)
               {
                  this.clearDots();
                  this.setInactive();
                  path.setActive();
               }
               for(i = 0; i < this.pathlist.length; i++)
               {
                  if(Boolean(this.pathlist[i].active) && this.pathlist[i] != path)
                  {
                     path.addChild(this.pathlist[i]);
                     this.pathlist[i].x -= path.x;
                     this.pathlist[i].y -= path.y;
                  }
               }
               for(i = 0; i < this.cutlist.length; i++)
               {
                  parents = this.cutlist[i].pathlist;
                  movecut = true;
                  for each(p in parents)
                  {
                     if(p.active == false)
                     {
                        movecut = false;
                     }
                  }
                  if(movecut == true)
                  {
                     path.addChild(this.cutlist[i]);
                     this.cutlist[i].x -= path.x;
                     this.cutlist[i].y -= path.y;
                  }
               }
               path.addEventListener(MouseEvent.MOUSE_UP,this.pathMouseUp);
            }
         }
      }
      
      public function pathMouseUp(e:MouseEvent, epath:Path = null) : void
      {
         var path:Path = null;
         var xdelta:Number = NaN;
         var ydelta:Number = NaN;
         var plist:Array = null;
         var p:* = undefined;
         var i:* = undefined;
         var undo:UndoMove = null;
         var c:CutObject = null;
         var moved:int = 0;
         if(epath != null)
         {
            path = epath;
         }
         else if(e.target is Segment)
         {
            path = e.target.parent as Path;
         }
         else if(e.target is Path)
         {
            path = e.target as Path;
         }
         if(path != null)
         {
            while(path.parent is Path)
            {
               path = path.parent as Path;
            }
            path.stopDrag();
            path.dragging = false;
            path.mouseChildren = true;
            trace("uppped");
            if(path != null && Global.tool == 0)
            {
               xdelta = e.stageX - this.xstart;
               ydelta = e.stageY - this.ystart;
               if(isNaN(xdelta))
               {
                  xdelta = 0;
               }
               if(isNaN(ydelta))
               {
                  ydelta = 0;
               }
               path.docx += xdelta / Global.zoom;
               path.docy += ydelta / Global.zoom;
               path.x = path.docx * Global.zoom;
               path.y = path.docy * Global.zoom;
               plist = new Array();
               if(path)
               {
                  for(i = 0; i < path.numChildren; i++)
                  {
                     p = path.getChildAt(i);
                     if(p is Path || p is CutObject)
                     {
                        plist.push(path.getChildAt(i));
                     }
                  }
                  for each(p in plist)
                  {
                     p.docx += xdelta / Global.zoom;
                     p.docy += ydelta / Global.zoom;
                     p.x = p.docx * Global.zoom;
                     p.y = p.docy * Global.zoom;
                     this.addChild(p);
                  }
               }
               if(xdelta != 0 || ydelta != 0)
               {
                  undo = new UndoMove(this);
                  undo.xdelta = xdelta / Global.zoom;
                  undo.ydelta = ydelta / Global.zoom;
                  undo.pathlist = plist;
                  undo.pathlist.push(path);
                  Global.undoPush(undo);
                  for each(c in this.cutlist)
                  {
                     moved = 0;
                     for each(path in c.pathlist)
                     {
                        if(plist.indexOf(path) != -1)
                        {
                           moved++;
                        }
                     }
                     if(moved > 0 && moved < c.pathlist.length)
                     {
                        for each(path in c.pathlist)
                        {
                           if(plist.indexOf(path) != -1)
                           {
                              path.dirty = true;
                              path.camdirty = true;
                           }
                        }
                     }
                  }
               }
            }
            for(i = 0; i < this.pathlist.length; i++)
            {
               addChild(this.pathlist[i]);
            }
            path.removeEventListener(MouseEvent.MOUSE_UP,this.pathMouseUp);
         }
         this.redrawCuts();
      }
      
      public function mouseLeave() : void
      {
         for(var i:int = 0; i < this.pathlist.length; i++)
         {
            if(this.pathlist[i].dragging == true)
            {
               this.pathMouseUp(new MouseEvent(MouseEvent.MOUSE_UP),this.pathlist[i]);
            }
            this.pathlist[i].pubPointUpAction();
         }
      }
      
      public function select(selectbox:Sprite) : void
      {
         var perfect:Boolean = true;
         if(this.pathlist.length > 1000)
         {
            perfect = false;
         }
         selectbox.alpha = 1;
         for(var i:int = 0; i < this.pathlist.length; i++)
         {
            if(HitTest.complexHitTestObject(selectbox,this.pathlist[i]))
            {
               if(this.pathlist[i].active)
               {
                  this.pathlist[i].setInactive();
               }
               else
               {
                  this.pathlist[i].setActive();
               }
            }
         }
         for(i = 0; i < this.cutlist.length; i++)
         {
            if(HitTest.complexHitTestObject(selectbox,this.cutlist[i]))
            {
               if(this.cutlist[i].active)
               {
                  this.cutlist[i].setInactive();
               }
               else
               {
                  this.cutlist[i].setActive();
               }
            }
         }
      }
      
      public function deleteSelected() : void
      {
         var i:* = 0;
         var path:Path = null;
         var j:int = 0;
         var dirty:Boolean = false;
         var index:int = 0;
         var cut:CutObject = null;
         var undo:UndoDelete = null;
         var removedcuts:Array = new Array();
         var removedpaths:Array = new Array();
         var cutparent:Array = new Array();
         for(i = 0; i < this.cutlist.length; i++)
         {
            for(j = 0; j < this.pathlist.length; j++)
            {
               dirty = false;
               if(this.pathlist[j].active == true)
               {
                  cutparent.push({
                     "cut":this.cutlist[i],
                     "path":this.pathlist[j]
                  });
                  index = int(this.cutlist[i].pathlist.indexOf(this.pathlist[j]));
                  if(index != -1)
                  {
                     this.cutlist[i].pathlist.splice(index,1);
                     dirty = true;
                  }
               }
               if(this.cutlist[i].pathlist.length == 0)
               {
                  cut = this.cutlist[i];
                  if(this.removeCut(cut))
                  {
                     removedcuts.push(cut);
                     i--;
                     break;
                  }
               }
               else if(dirty)
               {
                  this.cutlist[i].pathlist[0].dirty = true;
                  this.cutlist[i].pathlist[0].camdirty = true;
               }
            }
         }
         i = 0;
         while(i < this.pathlist.length)
         {
            path = this.pathlist[i];
            if(path.active == true)
            {
               removedpaths.push(path);
               if(this.removePath(path))
               {
                  i--;
               }
            }
            else if(path.deleteActive() == true)
            {
               if(this.removePath(path))
               {
                  i--;
               }
            }
            i++;
         }
         for(i = 0; i < this.cutlist.length; i++)
         {
            cut = this.cutlist[i];
            if(this.cutlist[i].active == true)
            {
               if(this.removeCut(cut))
               {
                  removedcuts.push(cut);
                  i--;
               }
            }
         }
         if(removedpaths.length > 0 || removedcuts.length > 0)
         {
            undo = new UndoDelete(this);
            undo.pathlist = removedpaths;
            undo.cutlist = removedcuts;
            undo.cutparent = cutparent;
            Global.undoPush(undo);
         }
         for(i = 0; i < this.cutlist.length; i++)
         {
            this.cutlist[i].removeActiveTabs();
         }
         this.clearDots();
      }
      
      public function getPathNumActive() : int
      {
         var n:int = 0;
         for(var i:int = 0; i < this.pathlist.length; i++)
         {
            if(this.pathlist[i].active == true)
            {
               n++;
            }
         }
         return n;
      }
      
      public function startCopy() : void
      {
         var p:Path = null;
         this.copylist = new Array();
         for(var i:int = 0; i < this.pathlist.length; i++)
         {
            if(this.pathlist[i].active == true)
            {
               p = this.pathlist[i].clone();
               this.copylist.push(p);
            }
         }
      }
      
      public function startPaste(p:Point = null) : void
      {
         var min:Point = null;
         var j:int = 0;
         var diff:Point = null;
         var m:Point = null;
         this.setInactive();
         if(p != null && this.copylist.length > 0)
         {
            min = this.copylist[0].getMin().clone();
            for(j = 0; j < this.copylist.length; j++)
            {
               m = this.copylist[j].getMin();
               if(m.x < min.x)
               {
                  min.x = m.x;
               }
               if(m.y < min.y)
               {
                  min.y = m.y;
               }
            }
            diff = new Point(p.x - min.x,p.y - min.y);
            for(j = 0; j < this.copylist.length; j++)
            {
               this.copylist[j].docx += diff.x;
               this.copylist[j].docy -= diff.y;
               this.copylist[j].x = this.copylist[j].docx * Global.zoom + Global.xorigin;
               this.copylist[j].y = -this.copylist[j].docy * Global.zoom + Global.yorigin;
            }
         }
         this.addPaths(this.copylist);
         this.redraw();
         var newlist:Array = new Array();
         for(var i:int = 0; i < this.copylist.length; i++)
         {
            newlist.push(this.copylist[i].clone());
         }
         this.copylist = newlist;
      }
      
      public function applyMatrixLocal(m:Matrix) : void
      {
         var pathav:Point = null;
         var newdoc:Point = null;
         var average:Point = new Point(0,0);
         var len:int = 0;
         for(var i:int = 0; i < this.pathlist.length; i++)
         {
            if(this.pathlist[i].active == true)
            {
               pathav = this.pathlist[i].getAverage();
               average.x += pathav.x;
               average.y += pathav.y;
               len++;
            }
         }
         average.x /= len;
         average.y /= len;
         var newaverage:Point = m.transformPoint(average);
         var dis:Point = new Point(newaverage.x - average.x,newaverage.y - average.y);
         for(i = 0; i < this.pathlist.length; i++)
         {
            if(this.pathlist[i].active == true)
            {
               this.pathlist[i].matrixTransform(m);
               newdoc = m.transformPoint(new Point(this.pathlist[i].docx,-this.pathlist[i].docy));
               this.pathlist[i].docx = newdoc.x;
               this.pathlist[i].docy = -newdoc.y;
            }
         }
         for(i = 0; i < this.pathlist.length; i++)
         {
            if(this.pathlist[i].active == true)
            {
               this.pathlist[i].docx -= dis.x;
               this.pathlist[i].docy += dis.y;
            }
         }
         this.redraw();
      }
      
      public function closeLoop(dot:Dot) : Point
      {
         var snappoint:Point = null;
         for(var i:int = 0; i < this.pathlist.length; i++)
         {
            snappoint = this.pathlist[i].snapPoint(dot);
            if(snappoint != null)
            {
               if(dot)
               {
                  dot.looppath = this.pathlist[i];
               }
               return snappoint;
            }
         }
         return null;
      }
      
      public function profile(flist:Array) : void
      {
         var cutname:String = String(flist[0].input.text);
         var tooldiameter:Number = Math.abs(Number(flist[1].input.text));
         var targetdepth:Number = Number(flist[2].input.text);
         var outside:Boolean = Boolean(flist[3].input.selectedItem.data);
         var safetyheight:Number = Number(flist[4].input.text);
         var stocksurface:Number = Number(flist[5].input.text);
         var stepdown:Number = Math.abs(Number(flist[6].input.text));
         var feedrate:Number = Math.abs(Number(flist[7].input.text));
         var plungerate:Number = Math.abs(Number(flist[8].input.text));
         var dir:int = int(flist[9].input.selectedItem.data);
         if(Global.unit == "cm")
         {
            tooldiameter /= 10;
         }
         if(isNaN(safetyheight) || isNaN(stocksurface) || isNaN(targetdepth) || isNaN(tooldiameter) || tooldiameter == 0 || isNaN(stepdown) || stepdown == 0 || isNaN(feedrate) || feedrate == 0 || isNaN(plungerate) || plungerate == 0)
         {
            return;
         }
         var selectedpaths:Array = new Array();
         for(var i:int = 0; i < this.pathlist.length; i++)
         {
            if(this.pathlist[i].active == true)
            {
               selectedpaths.push(this.pathlist[i]);
            }
         }
         var cut:ProfileCutObject = new ProfileCutObject();
         cut.name = cutname;
         cut.outside = outside;
         cut.safetyheight = safetyheight;
         cut.stocksurface = stocksurface;
         cut.targetdepth = targetdepth;
         cut.tooldiameter = tooldiameter;
         cut.stepdown = stepdown;
         cut.feedrate = feedrate;
         cut.plungerate = plungerate;
         cut.dir = dir;
         cut.pathlist = selectedpaths;
         this.addCut(cut);
         this.redraw();
      }
      
      public function editprofile(flist:Array) : void
      {
         var cutname:String = String(flist[0].input.text);
         var tooldiameter:Number = Math.abs(Number(flist[1].input.text));
         var targetdepth:Number = Number(flist[2].input.text);
         var outside:Boolean = Boolean(flist[3].input.selectedItem.data);
         var safetyheight:Number = Number(flist[4].input.text);
         var stocksurface:Number = Number(flist[5].input.text);
         var stepdown:Number = Math.abs(Number(flist[6].input.text));
         var feedrate:Number = Math.abs(Number(flist[7].input.text));
         var plungerate:Number = Math.abs(Number(flist[8].input.text));
         var dir:int = int(flist[9].input.selectedItem.data);
         if(Global.unit == "cm")
         {
            tooldiameter /= 10;
         }
         var main:* = this.parent;
         var cut:ProfileCutObject = main.tools.dToolpaths.selectedItem.data;
         var redrawcut:Boolean = false;
         if(cut.tooldiameter != tooldiameter || cut.outside != outside || cut.dir != dir)
         {
            redrawcut = true;
         }
         cut.name = cutname;
         main.tools.dToolpaths.selectedItem.label = cutname;
         cut.outside = outside;
         cut.safetyheight = isNaN(safetyheight) ? cut.safetyheight : safetyheight;
         cut.stocksurface = isNaN(stocksurface) ? cut.stocksurface : stocksurface;
         cut.targetdepth = isNaN(targetdepth) ? cut.targetdepth : targetdepth;
         cut.tooldiameter = isNaN(tooldiameter) || tooldiameter == 0 ? cut.tooldiameter : tooldiameter;
         cut.stepdown = isNaN(stepdown) || stepdown == 0 ? cut.stepdown : stepdown;
         cut.feedrate = isNaN(feedrate) || feedrate == 0 ? cut.feedrate : feedrate;
         cut.plungerate = isNaN(plungerate) || plungerate == 0 ? cut.plungerate : plungerate;
         cut.dir = dir;
         if(redrawcut)
         {
            cut.pathlist[0].dirty = true;
            cut.pathlist[0].camdirty = true;
            cut.processed = false;
            this.redraw();
         }
      }
      
      public function pocket(flist:Array) : void
      {
         var cutname:String = String(flist[0].input.text);
         var tooldiameter:Number = Math.abs(Number(flist[1].input.text));
         var targetdepth:Number = Number(flist[2].input.text);
         var safetyheight:Number = Number(flist[3].input.text);
         var stocksurface:Number = Number(flist[4].input.text);
         var stepover:Number = 0.01 * Math.abs(Number(flist[5].input.text));
         var stepdown:Number = Math.abs(Number(flist[6].input.text));
         var roughingclearance:Number = Math.abs(Number(flist[7].input.text));
         var feedrate:Number = Math.abs(Number(flist[8].input.text));
         var plungerate:Number = Math.abs(Number(flist[9].input.text));
         var dir:int = int(flist[10].input.selectedItem.data);
         if(Global.unit == "cm")
         {
            tooldiameter /= 10;
            roughingclearance /= 10;
         }
         if(isNaN(safetyheight) || isNaN(stocksurface) || isNaN(targetdepth) || isNaN(tooldiameter) || isNaN(stepdown) || stepdown == 0 || isNaN(stepover) || stepover == 0 || isNaN(feedrate) || feedrate == 0 || isNaN(plungerate) || plungerate == 0 || isNaN(roughingclearance))
         {
            return;
         }
         var selectedpaths:Array = new Array();
         for(var i:int = 0; i < this.pathlist.length; i++)
         {
            if(this.pathlist[i].active == true)
            {
               selectedpaths.push(this.pathlist[i]);
            }
         }
         var cut:PocketCutObject = new PocketCutObject();
         cut.name = cutname;
         cut.safetyheight = safetyheight;
         cut.stocksurface = stocksurface;
         cut.targetdepth = targetdepth;
         cut.tooldiameter = tooldiameter;
         cut.stepover = stepover;
         cut.stepdown = stepdown;
         cut.roughingclearance = roughingclearance;
         cut.feedrate = feedrate;
         cut.plungerate = plungerate;
         cut.dir = dir;
         cut.pathlist = selectedpaths;
         this.addCut(cut);
         this.redraw();
      }
      
      public function editpocket(flist:Array) : void
      {
         var cutname:String = String(flist[0].input.text);
         var tooldiameter:Number = Math.abs(Number(flist[1].input.text));
         var targetdepth:Number = Number(flist[2].input.text);
         var safetyheight:Number = Number(flist[3].input.text);
         var stocksurface:Number = Number(flist[4].input.text);
         var stepover:Number = 0.01 * Math.abs(Number(flist[5].input.text));
         var stepdown:Number = Math.abs(Number(flist[6].input.text));
         var roughingclearance:Number = Math.abs(Number(flist[7].input.text));
         var feedrate:Number = Math.abs(Number(flist[8].input.text));
         var plungerate:Number = Math.abs(Number(flist[9].input.text));
         var dir:int = int(flist[10].input.selectedItem.data);
         if(Global.unit == "cm")
         {
            tooldiameter /= 10;
            roughingclearance /= 10;
         }
         var main:* = this.parent;
         var cut:PocketCutObject = main.tools.dToolpaths.selectedItem.data;
         var redrawcut:Boolean = false;
         if(tooldiameter != cut.tooldiameter || roughingclearance != cut.roughingclearance || stepover != cut.stepover || dir != cut.dir)
         {
            redrawcut = true;
         }
         cut.name = cutname;
         main.tools.dToolpaths.selectedItem.label = cutname;
         cut.safetyheight = isNaN(safetyheight) ? cut.safetyheight : safetyheight;
         cut.stocksurface = isNaN(stocksurface) ? cut.stocksurface : stocksurface;
         cut.targetdepth = isNaN(targetdepth) ? cut.targetdepth : targetdepth;
         cut.tooldiameter = isNaN(tooldiameter) || tooldiameter == 0 ? cut.tooldiameter : tooldiameter;
         cut.stepover = isNaN(stepover) || stepover == 0 ? cut.stepover : stepover;
         cut.stepdown = isNaN(stepdown) || stepdown == 0 ? cut.stepdown : stepdown;
         cut.roughingclearance = isNaN(roughingclearance) ? cut.roughingclearance : roughingclearance;
         cut.feedrate = isNaN(feedrate) || feedrate == 0 ? cut.feedrate : feedrate;
         cut.plungerate = isNaN(plungerate) || plungerate == 0 ? cut.plungerate : plungerate;
         cut.dir = dir;
         if(redrawcut)
         {
            cut.pathlist[0].dirty = true;
            cut.pathlist[0].camdirty = true;
            cut.processed = false;
            this.redraw();
         }
      }
      
      public function followpath(flist:Array) : void
      {
         var cutname:String = String(flist[0].input.text);
         var tooldiameter:Number = Math.abs(Number(flist[1].input.text));
         var targetdepth:Number = Number(flist[2].input.text);
         var safetyheight:Number = Number(flist[3].input.text);
         var stocksurface:Number = Number(flist[4].input.text);
         var stepdown:Number = Math.abs(Number(flist[5].input.text));
         var feedrate:Number = Math.abs(Number(flist[6].input.text));
         var plungerate:Number = Math.abs(Number(flist[7].input.text));
         if(isNaN(tooldiameter) || isNaN(safetyheight) || isNaN(stocksurface) || isNaN(targetdepth) || isNaN(stepdown) || stepdown == 0 || isNaN(feedrate) || feedrate == 0 || isNaN(plungerate) || plungerate == 0)
         {
            return;
         }
         if(Global.unit == "cm")
         {
            tooldiameter /= 10;
         }
         var selectedpaths:Array = new Array();
         for(var i:int = 0; i < this.pathlist.length; i++)
         {
            if(this.pathlist[i].active == true)
            {
               selectedpaths.push(this.pathlist[i]);
            }
         }
         var cut:FollowPathCutObject = new FollowPathCutObject();
         cut.name = cutname;
         cut.tooldiameter = tooldiameter;
         cut.targetdepth = targetdepth;
         cut.safetyheight = safetyheight;
         cut.stocksurface = stocksurface;
         cut.stepdown = stepdown;
         cut.feedrate = feedrate;
         cut.plungerate = plungerate;
         cut.pathlist = selectedpaths;
         this.addCut(cut);
         this.redraw();
      }
      
      public function editfollowpath(flist:Array) : void
      {
         var cutname:String = String(flist[0].input.text);
         var tooldiameter:Number = Math.abs(Number(flist[1].input.text));
         var targetdepth:Number = Number(flist[2].input.text);
         var safetyheight:Number = Number(flist[3].input.text);
         var stocksurface:Number = Number(flist[4].input.text);
         var stepdown:Number = Math.abs(Number(flist[5].input.text));
         var feedrate:Number = Math.abs(Number(flist[6].input.text));
         var plungerate:Number = Math.abs(Number(flist[7].input.text));
         if(Global.unit == "cm")
         {
            tooldiameter /= 10;
         }
         var main:* = this.parent;
         var cut:FollowPathCutObject = main.tools.dToolpaths.selectedItem.data;
         cut.name = cutname;
         main.tools.dToolpaths.selectedItem.label = cutname;
         cut.tooldiameter = isNaN(tooldiameter) || tooldiameter == 0 ? cut.tooldiameter : tooldiameter;
         cut.safetyheight = isNaN(safetyheight) ? cut.safetyheight : safetyheight;
         cut.stocksurface = isNaN(stocksurface) ? cut.stocksurface : stocksurface;
         cut.targetdepth = isNaN(targetdepth) ? cut.targetdepth : targetdepth;
         cut.stepdown = isNaN(stepdown) || stepdown == 0 ? cut.stepdown : stepdown;
         cut.feedrate = isNaN(feedrate) || feedrate == 0 ? cut.feedrate : feedrate;
         cut.plungerate = isNaN(plungerate) || plungerate == 0 ? cut.plungerate : plungerate;
         this.redraw();
      }
      
      public function drill(flist:Array) : void
      {
         var cutname:String = String(flist[0].input.text);
         var tooldiameter:Number = Math.abs(Number(flist[1].input.text));
         var targetdepth:Number = Number(flist[2].input.text);
         var center:Boolean = Boolean(flist[3].input.selectedItem.data);
         var spacing:Number = Number(flist[4].input.text);
         var safetyheight:Number = Number(flist[5].input.text);
         var stocksurface:Number = Number(flist[6].input.text);
         var stepdown:Number = Math.abs(Number(flist[7].input.text));
         var plungerate:Number = Math.abs(Number(flist[8].input.text));
         if(isNaN(tooldiameter) || isNaN(safetyheight) || isNaN(stocksurface) || isNaN(targetdepth) || isNaN(stepdown) || stepdown == 0 || isNaN(plungerate) || plungerate == 0 || isNaN(spacing) || spacing == 0)
         {
            return;
         }
         if(Global.unit == "cm")
         {
            tooldiameter /= 10;
            spacing /= 10;
         }
         var selectedpaths:Array = new Array();
         for(var i:int = 0; i < this.pathlist.length; i++)
         {
            if(this.pathlist[i].active == true)
            {
               selectedpaths.push(this.pathlist[i]);
            }
         }
         var cut:DrillCutObject = new DrillCutObject();
         cut.name = cutname;
         cut.tooldiameter = tooldiameter;
         cut.targetdepth = targetdepth;
         cut.center = center;
         cut.spacing = spacing;
         cut.safetyheight = safetyheight;
         cut.stocksurface = stocksurface;
         cut.stepdown = stepdown;
         cut.plungerate = plungerate;
         cut.pathlist = selectedpaths;
         this.addCut(cut);
         this.redraw();
      }
      
      public function editdrill(flist:Array) : void
      {
         var cutname:String = String(flist[0].input.text);
         var tooldiameter:Number = Math.abs(Number(flist[1].input.text));
         var targetdepth:Number = Number(flist[2].input.text);
         var center:Boolean = Boolean(flist[3].input.selectedItem.data);
         var spacing:Number = Number(flist[4].input.text);
         var safetyheight:Number = Number(flist[5].input.text);
         var stocksurface:Number = Number(flist[6].input.text);
         var stepdown:Number = Math.abs(Number(flist[7].input.text));
         var plungerate:Number = Math.abs(Number(flist[8].input.text));
         if(Global.unit == "cm")
         {
            tooldiameter /= 10;
            spacing /= 10;
         }
         var main:* = this.parent;
         var cut:DrillCutObject = main.tools.dToolpaths.selectedItem.data;
         var redrawcut:Boolean = false;
         if(center != cut.center)
         {
            redrawcut = true;
         }
         cut.name = cutname;
         main.tools.dToolpaths.selectedItem.label = cutname;
         cut.tooldiameter = isNaN(tooldiameter) || tooldiameter == 0 ? cut.tooldiameter : tooldiameter;
         cut.center = center;
         cut.spacing = isNaN(spacing) || spacing == 0 ? cut.spacing : spacing;
         cut.safetyheight = isNaN(safetyheight) ? cut.safetyheight : safetyheight;
         cut.stocksurface = isNaN(stocksurface) ? cut.stocksurface : stocksurface;
         cut.targetdepth = isNaN(targetdepth) ? cut.targetdepth : targetdepth;
         cut.stepdown = isNaN(stepdown) || stepdown == 0 ? cut.stepdown : stepdown;
         cut.plungerate = isNaN(plungerate) || plungerate == 0 ? cut.plungerate : plungerate;
         if(redrawcut)
         {
            cut.pathlist[0].dirty = true;
            cut.pathlist[0].camdirty = true;
            cut.processed = false;
         }
         this.redraw();
      }
      
      public function batch(flist:Array) : void
      {
         var cut:* = undefined;
         var tooldiameter:Number = Math.abs(Number(flist[0].input.text));
         var targetdepth:Number = Number(flist[1].input.text);
         var outside:Boolean = Boolean(flist[2].input.selectedItem.data);
         var safetyheight:Number = Number(flist[3].input.text);
         var stocksurface:Number = Number(flist[4].input.text);
         var stepover:Number = 0.01 * Math.abs(Number(flist[5].input.text));
         var stepdown:Number = Math.abs(Number(flist[6].input.text));
         var roughingclearance:Number = Math.abs(Number(flist[7].input.text));
         var feedrate:Number = Math.abs(Number(flist[8].input.text));
         var plungerate:Number = Math.abs(Number(flist[9].input.text));
         var dir:int = int(flist[10].input.selectedItem.data);
         var center:Boolean = Boolean(flist[11].input.selectedItem.data);
         var spacing:Number = Number(flist[12].input.text);
         if(Global.unit == "cm")
         {
            tooldiameter /= 10;
            roughingclearance /= 10;
         }
         if(isNaN(safetyheight) || isNaN(stocksurface) || isNaN(targetdepth) || isNaN(tooldiameter) || isNaN(stepdown) || stepdown == 0 || isNaN(feedrate) || feedrate == 0 || isNaN(plungerate) || plungerate == 0)
         {
            return;
         }
         var selectedcuts:Array = new Array();
         for(var i:int = 0; i < this.cutlist.length; i++)
         {
            if(this.cutlist[i].active == true)
            {
               selectedcuts.push(this.cutlist[i]);
            }
         }
         for each(cut in selectedcuts)
         {
            cut.pathlist[0].dirty = true;
            cut.pathlist[0].camdirty = true;
            cut.processed = false;
            cut.safetyheight = safetyheight;
            cut.stocksurface = stocksurface;
            cut.outside = outside;
            cut.targetdepth = targetdepth;
            cut.tooldiameter = tooldiameter;
            cut.stepover = stepover;
            cut.stepdown = stepdown;
            cut.roughingclearance = roughingclearance;
            cut.feedrate = feedrate;
            cut.plungerate = plungerate;
            cut.dir = dir;
            cut.center = center;
            cut.spacing = spacing;
         }
         this.redraw();
      }
      
      public function zeroSelected() : void
      {
         for(var i:int = 0; i < this.pathlist.length; i++)
         {
            if(this.pathlist[i].active == true)
            {
               this.pathlist[i].zeroOrigin();
            }
         }
      }
      
      public function getProcessedCuts() : Array
      {
         var processed:Array = new Array();
         for(var i:int = 0; i < this.cutlist.length; i++)
         {
            if(this.cutlist[i].processed == true)
            {
               processed.push(this.cutlist[i]);
            }
         }
         return processed;
      }
      
      public function addCut(cut:CutObject) : void
      {
         var path:Path = null;
         var main:* = undefined;
         var cutgroup:Array = new Array(cut);
         if(Global.separatetoolpaths)
         {
            cutgroup = cut.group();
         }
         for each(cut in cutgroup)
         {
            this.cutlist.push(cut);
            addChild(cut);
            for each(path in cut.pathlist)
            {
               path.dirty = true;
               path.camdirty = true;
            }
            main = this.parent;
            main.tools.dToolpaths.addItem({
               "label":cut.name,
               "data":cut
            });
            main.tools.dToolpaths.height = Math.max(this.cutlist.length * 20,20);
            cut.setActive();
         }
      }
      
      public function removeCut(cut:CutObject) : Boolean
      {
         var main:* = undefined;
         if(cut == null)
         {
            return false;
         }
         if(this.contains(cut))
         {
            removeChild(cut);
         }
         var index:int = this.cutlist.indexOf(cut);
         if(index != -1)
         {
            this.cutlist.splice(index,1);
            main = this.parent;
            main.tools.dToolpaths.removeItemAt(index);
            main.tools.dToolpaths.height = Math.max(this.cutlist.length * 20,20);
            return true;
         }
         return false;
      }
      
      public function reprocessCuts(pd:ProgressDialog, activeonly:Boolean = false, cut:CutObject = null) : void
      {
         var reprocess:Boolean = false;
         var path:Path = null;
         this.progressdialog = pd;
         this.processlist = new Array();
         if(cut != null)
         {
            this.processlist.push(cut);
         }
         else
         {
            for each(cut in this.cutlist)
            {
               if(!(activeonly && cut.active == false))
               {
                  reprocess = false;
                  for each(path in cut.pathlist)
                  {
                     path.zeroOrigin();
                     path.redraw();
                     if(path.camdirty == true)
                     {
                        path.camdirty = false;
                        reprocess = true;
                     }
                  }
                  if(reprocess || cut.processed == false)
                  {
                     this.processlist.push(cut);
                  }
               }
            }
         }
         this.progressdialog.init(this.processlist.length);
         this.processNext();
         this.redraw();
      }
      
      protected function processNext() : void
      {
         var cut:CutObject = null;
         if(this.processlist.length > 0)
         {
            cut = this.processlist[0];
            cut.addEventListener(ProgressEvent.PROGRESS,this.cutProgress);
            cut.addEventListener(Event.COMPLETE,this.cutComplete);
            cut.start();
         }
         else
         {
            this.progressdialog.stopDialog();
         }
      }
      
      protected function cutProgress(e:ProgressEvent) : void
      {
         var cutprogress:Number = Math.min(e.bytesLoaded / e.bytesTotal,1);
         var totalprogress:Number = this.progressdialog.total - this.processlist.length + cutprogress;
         this.progressdialog.setProgress(totalprogress);
      }
      
      protected function cutComplete(e:Event) : *
      {
         var cut:CutObject = null;
         if(e.target is CutObject)
         {
            cut = e.target as CutObject;
            cut.removeEventListener(ProgressEvent.PROGRESS,this.cutProgress);
            cut.removeEventListener(Event.COMPLETE,this.cutComplete);
            if(this.processlist.length > 0)
            {
               this.processlist.shift();
            }
            this.processNext();
         }
      }
      
      public function cutCancel() : void
      {
         var current:CutObject = null;
         var main:* = this.parent;
         if(this.processlist.length > 0)
         {
            current = this.processlist.shift();
            current.stop();
            current.processed = false;
         }
         current.pathlist[0].dirty = true;
         current.pathlist[0].camdirty = true;
         this.processlist = new Array();
      }
      
      public function processFile(pd:ProgressDialog, svgxml:XML) : void
      {
         this.progressdialog = pd;
         pd.init(1);
         var processor:ProcessFile = new ProcessFile(this,this.pathlist,svgxml);
         processor.addEventListener(ProgressEvent.PROGRESS,this.processProgress);
         processor.addEventListener(Event.COMPLETE,this.processComplete);
         addChild(processor);
         processor.start();
      }
      
      public function processProgress(e:ProgressEvent) : void
      {
         this.progressdialog.setProgress(e.bytesLoaded / e.bytesTotal);
      }
      
      public function processComplete(e:Event) : void
      {
         var path:Path = null;
         var processor:ProcessFile = null;
         for each(path in this.pathlist)
         {
            if(path.active == true)
            {
               if(Global.withinTolerance(path.seglist[0].p1,path.seglist[path.seglist.length - 1].p2))
               {
                  path.seglist[0].p1 = path.seglist[path.seglist.length - 1].p2;
               }
            }
         }
         processor = e.target as ProcessFile;
         processor.removeEventListener(ProgressEvent.PROGRESS,this.processProgress);
         processor.removeEventListener(Event.COMPLETE,this.processComplete);
         this.loadCuts(processor.svgxml);
         this.progressdialog.stopDialog();
         removeChild(processor);
         this.redraw();
      }
      
      public function loadCuts(svg:XML) : void
      {
         var metadata:XML = null;
         var child:XML = null;
         var path:Path = null;
         for each(child in svg.*)
         {
            if(child.localName() == "metadata")
            {
               metadata = child;
            }
         }
         if(metadata == null)
         {
            return;
         }
         for each(child in metadata.*)
         {
            if(child.localName() == "cutobject")
            {
               this.loadCutObject(child);
            }
         }
         for each(path in this.pathlist)
         {
            path.name = "";
         }
      }
      
      protected function loadCutObject(cutobject:XML) : void
      {
         var child:XML = null;
         var cut:CutObject = null;
         var id:String = null;
         var path:Path = null;
         var children:Array = new Array();
         for each(child in cutobject.*)
         {
            if(child.localName() == "path")
            {
               id = String(child.text());
               for each(path in this.pathlist)
               {
                  if(path.name == id)
                  {
                     children.push(path);
                  }
               }
            }
         }
         if(children.length == 0)
         {
            return;
         }
         var type:String = cutobject.@type;
         if(type == "profile")
         {
            cut = new ProfileCutObject();
         }
         else if(type == "pocket")
         {
            cut = new PocketCutObject();
         }
         else if(type == "followpath")
         {
            cut = new FollowPathCutObject();
         }
         else if(type == "drill")
         {
            cut = new DrillCutObject();
         }
         var cutname:String = unescape(cutobject.@name);
         if(cutname == "")
         {
            cutname = "unnamed operation";
         }
         cut.name = cutname;
         cut.safetyheight = cutobject.@safetyheight;
         cut.stocksurface = cutobject.@stocksurface;
         cut.targetdepth = cutobject.@targetdepth;
         cut.stepover = cutobject.@stepover;
         cut.stepdown = cutobject.@stepdown;
         cut.feedrate = cutobject.@feedrate;
         cut.plungerate = cutobject.@plungerate;
         cut.outside = cutobject.@outside == "true" ? true : false;
         cut.dir = cutobject.@direction == "2" ? 2 : 1;
         cut.center = cutobject.@center == "true" ? true : false;
         cut.spacing = cutobject.@spacing;
         cut.tooldiameter = cutobject.@tooldiameter;
         cut.roughingclearance = cutobject.@roughingclearance;
         if(Global.unit == "in" && cutobject.@unit == "metric")
         {
            cut.safetyheight /= 25.4;
            cut.stocksurface /= 25.4;
            cut.targetdepth /= 25.4;
            cut.stepdown /= 25.4;
            cut.feedrate /= 25.4;
            cut.plungerate /= 25.4;
            cut.tooldiameter /= 2.54;
            cut.roughingclearance /= 2.54;
            cut.spacing /= 2.54;
         }
         else if(Global.unit == "cm" && cutobject.@unit == "imperial")
         {
            cut.safetyheight *= 25.4;
            cut.stocksurface *= 25.4;
            cut.targetdepth *= 25.4;
            cut.stepdown *= 25.4;
            cut.feedrate *= 25.4;
            cut.plungerate *= 25.4;
            cut.tooldiameter *= 2.54;
            cut.roughingclearance *= 2.54;
            cut.spacing *= 2.54;
         }
         for each(path in children)
         {
            path.zeroOrigin();
         }
         cut.pathlist = children;
         this.addCut(cut);
      }
      
      public function separateSelected() : void
      {
         var paths:Array = null;
         var j:int = 0;
         var p:Path = null;
         var index:int = 0;
         var len:* = int(this.pathlist.length);
         for(var i:* = 0; i < len; i++)
         {
            if(this.pathlist[i].active == true)
            {
               paths = this.pathlist[i].separate();
               if(paths.length > 0)
               {
                  for(j = 0; j < this.cutlist.length; j++)
                  {
                     index = int(this.cutlist.pathlist.indexOf(this.pathlist[i]));
                     if(index != -1)
                     {
                        this.cutlist.pathlist.splice(index,1,paths);
                     }
                  }
                  for each(p in paths)
                  {
                     p.name = this.pathlist[i].name;
                  }
                  this.pathlist.splice(i,1);
                  this.addPaths(paths);
                  i--;
                  len--;
               }
            }
         }
      }
      
      public function pathsOnTop() : void
      {
         var path:Path = null;
         for each(path in this.pathlist)
         {
            addChild(path);
         }
      }
      
      public function startNest(pd:ProgressDialog, directions:int, gap:Number, group:Boolean, groupprofile:Boolean) : Boolean
      {
         this.progressdialog = pd;
         if(this.nestpath == null)
         {
            return false;
         }
         if(this.cutlist.length < 2)
         {
            return false;
         }
         if(this.nest != null && contains(this.nest))
         {
            removeChild(this.nest);
         }
         this.nest = new Nest(this.nestpath,this.cutlist.slice(),directions,gap,group,groupprofile);
         addChild(this.nest);
         for(var i:int = 0; i < this.cutlist.length; i++)
         {
            addChild(this.cutlist[i]);
         }
         this.nest.addEventListener(ProgressEvent.PROGRESS,this.nestProgress);
         this.nest.start();
         if(this.nest.underlimit == true)
         {
            this.finishNest();
            return false;
         }
         this.progressdialog.init(1);
         return true;
      }
      
      private function nestProgress(e:ProgressEvent) : void
      {
         var nestprogress:Number = Math.min(e.bytesLoaded / e.bytesTotal,1);
         this.progressdialog.setProgress(nestprogress);
      }
      
      public function finishNest() : void
      {
         var data:Array = null;
         var region:Rectangle = null;
         var processed:Array = null;
         var i:int = 0;
         var cutobject:* = undefined;
         var cutarray:Array = null;
         var index:int = 0;
         var nestarray:Array = null;
         var j:int = 0;
         var matrix:Matrix = null;
         var childobject:* = undefined;
         var k:int = 0;
         this.nest.stop();
         this.nest.removeEventListener(ProgressEvent.PROGRESS,this.nestProgress);
         var fittest:Individual = this.nest.fittest;
         if(fittest)
         {
            data = fittest.data;
            region = this.nest.blank.getBounds(this.nest);
            processed = new Array();
            for(i = 0; i < data.length; i++)
            {
               if(!data[i].failed)
               {
                  cutobject = this.nest.cutlist[data[i].index];
                  cutarray = new Array(cutobject);
                  index = 0;
                  while(index < cutarray.length)
                  {
                     while(cutarray[index].numChildren > 0)
                     {
                        childobject = cutarray[index].getChildAt(0);
                        if(childobject is CutObject)
                        {
                           cutarray.push(childobject);
                        }
                        cutarray[index].removeChildAt(0);
                     }
                     index++;
                  }
                  nestarray = new Array();
                  for(j = 0; j < cutarray.length; j++)
                  {
                     for(k = 0; k < cutarray[j].pathlist.length; k++)
                     {
                        if(nestarray.indexOf(cutarray[j].pathlist[k]) == -1 && processed.indexOf(cutarray[j].pathlist[k]) == -1)
                        {
                           nestarray.push(cutarray[j].pathlist[k]);
                           processed.push(cutarray[j].pathlist[k]);
                        }
                     }
                  }
                  matrix = new Matrix();
                  matrix.rotate(-data[i].rotation * (Math.PI / 180));
                  matrix.translate(-data[i].x / Global.zoom,data[i].y / Global.zoom);
                  matrix.translate(region.x / Global.zoom,-(region.y + region.height - 1) / Global.zoom);
                  matrix.translate(data[i].i / (Global.zoom * this.nest.scale),(-data[i].j + this.nest.blankbitmap.height) / (Global.zoom * this.nest.scale));
                  for(j = 0; j < nestarray.length; j++)
                  {
                     nestarray[j].matrixTransform(matrix);
                  }
               }
            }
         }
         this.nest.finish();
         removeChild(this.nest);
         for(i = 0; i < this.cutlist.length; i++)
         {
            while(this.cutlist[i].numChildren > 0)
            {
               this.cutlist[i].removeChildAt(0);
            }
            addChild(this.cutlist[i]);
            this.cutlist[i].processed = false;
            this.cutlist[i].rotation = 0;
            this.cutlist[i].pathlist[0].dirty = true;
            this.cutlist[i].pathlist[0].camdirty = true;
            this.cutlist[i].graphics.clear();
         }
         this.redraw();
      }
      
      public function addTabsSelected(spacing:Number, tabwidth:Number, tabheight:Number) : void
      {
         for(var i:int = 0; i < this.cutlist.length; i++)
         {
            if(this.cutlist[i].active == true && this.cutlist[i] is ProfileCutObject && this.cutlist[i].processed == true)
            {
               this.cutlist[i].addTabs(spacing,tabwidth,tabheight);
            }
         }
      }
      
      public function shiftActive() : void
      {
         var j:int = 0;
         var path:Path = null;
         var inactive:Array = new Array();
         var active:Array = new Array();
         for(var i:int = 0; i < this.cutlist.length; i++)
         {
            if(this.cutlist[i].active == true)
            {
               active.push(this.cutlist[i]);
            }
            else
            {
               inactive.push(this.cutlist[i]);
            }
            this.cutlist[i].zeroOrigin();
            this.cutlist[i].pathlist[0].dirty = true;
            this.cutlist[i].pathlist[0].camdirty = true;
         }
         var irect:Rectangle = this.getExactBounds(inactive);
         var arect:Rectangle = this.getExactBounds(active);
         var diff:Number = 0;
         if(arect.x >= irect.x && arect.x <= irect.x + irect.width)
         {
            diff = irect.x + irect.width - arect.x;
         }
         else if(irect.x >= arect.x && irect.x <= arect.x + arect.width)
         {
            diff = arect.x + arect.width - irect.x;
            diff = -diff;
         }
         var processed:Array = new Array();
         for(i = 0; i < active.length; i++)
         {
            for(j = 0; j < active[i].pathlist.length; j++)
            {
               path = active[i].pathlist[j];
               if(processed.indexOf(path) == -1)
               {
                  path.docx += diff;
                  path.dirty = true;
                  path.camdirty = true;
                  processed.push(path);
               }
            }
         }
         this.redraw();
      }
      
      private function getExactBounds(list:Array) : Rectangle
      {
         var minx:Number = NaN;
         var miny:Number = NaN;
         var maxx:Number = NaN;
         var maxy:Number = NaN;
         var lminx:Number = NaN;
         var lminy:Number = NaN;
         var lmaxx:Number = NaN;
         var lmaxy:Number = NaN;
         var children:Array = null;
         var j:int = 0;
         var rect:Rectangle = null;
         for(var i:int = 0; i < list.length; i++)
         {
            lminx = NaN;
            lminy = NaN;
            lmaxx = NaN;
            lmaxy = NaN;
            children = list[i].rootpath.getChildren();
            for(j = 0; j < children.length; j++)
            {
               rect = children[j].getExactBounds();
               if(isNaN(lminx) || rect.x < lminx)
               {
                  lminx = rect.x;
               }
               if(isNaN(lmaxx) || rect.x + rect.width > lmaxx)
               {
                  lmaxx = rect.x + rect.width;
               }
               if(isNaN(lminy) || rect.y < lminy)
               {
                  lminy = rect.y;
               }
               if(isNaN(lmaxy) || rect.y + rect.height > lmaxy)
               {
                  lmaxy = rect.y + rect.height;
               }
            }
            if(list[i] is ProfileCutObject)
            {
               if(list[i].processed == true)
               {
                  lmaxx += 0.5 * list[i].tooldiameter;
                  lmaxy += 0.5 * list[i].tooldiameter;
                  lminx -= 0.5 * list[i].tooldiameter;
                  lminy -= 0.5 * list[i].tooldiameter;
               }
               else
               {
                  lmaxx += list[i].tooldiameter;
                  lmaxy += list[i].tooldiameter;
                  lminx -= list[i].tooldiameter;
                  lminy -= list[i].tooldiameter;
               }
            }
            else if(list[i] is FollowPathCutObject)
            {
               lmaxx += 0.5 * list[i].tooldiameter;
               lmaxy += 0.5 * list[i].tooldiameter;
               lminx -= 0.5 * list[i].tooldiameter;
               lminy -= 0.5 * list[i].tooldiameter;
            }
            if(isNaN(minx) || lminx < minx)
            {
               minx = lminx;
            }
            if(isNaN(maxx) || lmaxx > maxx)
            {
               maxx = lmaxx;
            }
            if(isNaN(miny) || lminy < miny)
            {
               miny = lminy;
            }
            if(isNaN(maxy) || lmaxy > maxy)
            {
               maxy = lmaxy;
            }
         }
         return new Rectangle(minx,miny,maxx - minx,maxy - miny);
      }
   }
}

