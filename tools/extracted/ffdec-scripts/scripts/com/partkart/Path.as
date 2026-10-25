package com.partkart
{
   import com.lorentz.SVG.*;
   import flash.display.*;
   import flash.events.*;
   import flash.geom.Matrix;
   import flash.geom.Point;
   
   public class Path extends Sprite
   {
      
      public var seglist:Array = new Array();
      
      public var dotlist:Array = new Array();
      
      public var docx:* = 0;
      
      public var docy:* = 0;
      
      protected var xstart:Number = 0;
      
      protected var ystart:Number = 0;
      
      protected var startpoint:Point;
      
      protected var startdot:Shape;
      
      public var dragging:Boolean = false;
      
      protected var linestyle:int = 0;
      
      public var active:Boolean = false;
      
      public var coord:coordinates;
      
      public var dirty:Boolean = true;
      
      public var camdirty:Boolean = true;
      
      public function Path()
      {
         super();
         this.cacheAsBitmap = true;
         this.setLineStyle(0);
         this.attachActions();
      }
      
      protected static function degreesToRadians(angle:Number) : Number
      {
         return angle * (Math.PI / 180);
      }
      
      protected static function radiansToDegrees(angle:Number) : Number
      {
         return angle * (180 / Math.PI);
      }
      
      public function addSegment(seg:Segment) : void
      {
         var i:int = 0;
         var dot:DisplayObject = null;
         this.seglist.push(seg);
         addChild(seg);
         if(Global.tool == 1)
         {
            this.addDots(seg);
            for(i = 0; i < numChildren; i++)
            {
               dot = getChildAt(i);
               if(dot is Dot)
               {
                  this.dotlist.push(dot);
               }
            }
         }
      }
      
      public function getSegments() : Array
      {
         var list:Array = new Array();
         return list.concat(this.seglist);
      }
      
      public function resetSegments() : void
      {
         var seg:* = undefined;
         var removelist:Array = new Array();
         for(var i:int = 0; i < numChildren; i++)
         {
            if(getChildAt(i) is Segment)
            {
               removelist.push(getChildAt(i));
            }
         }
         while(removelist.length > 0)
         {
            removeChild(removelist.shift());
         }
         for each(seg in this.seglist)
         {
            addChild(seg);
         }
      }
      
      public function render(sprite:Sprite = null) : void
      {
         this.setLineStyle(this.linestyle);
         for(var i:* = 0; i < this.seglist.length; i++)
         {
            if(this.seglist[i] is CubicBezierSegment)
            {
               this.renderCubic(this.seglist[i],sprite);
            }
            else if(this.seglist[i] is QuadBezierSegment)
            {
               this.renderQuad(this.seglist[i],sprite);
            }
            else if(this.seglist[i] is ArcSegment)
            {
               this.renderArc(this.seglist[i],sprite);
            }
            else
            {
               this.renderLine(this.seglist[i],sprite);
            }
         }
      }
      
      protected function attachActions() : void
      {
         addEventListener(MouseEvent.MOUSE_OVER,this.overAction);
         addEventListener(MouseEvent.MOUSE_DOWN,this.downAction);
         addEventListener(MouseEvent.MOUSE_MOVE,this.moveAction);
         addEventListener(MouseEvent.MOUSE_UP,this.upAction);
      }
      
      protected function getDot(point:Point) : Dot
      {
         var dot:* = undefined;
         for each(dot in this.dotlist)
         {
            if(Boolean(dot) && dot.point == point)
            {
               return dot;
            }
         }
         return null;
      }
      
      protected function getAttachedSegment(seg1:Segment, point:int) : Segment
      {
         var s:Segment = null;
         for(var i:* = 0; i < this.seglist.length; i++)
         {
            s = this.seglist[i];
            if(s != seg1 && (s.p2.equals(seg1.p1) && point == 1 || s.p1.equals(seg1.p2) && point == 2))
            {
               return s;
            }
         }
         return null;
      }
      
      public function isClosed() : Boolean
      {
         var s:Segment = null;
         var found1:Boolean = false;
         var found2:Boolean = false;
         var j:* = undefined;
         for(var i:* = 0; i < this.seglist.length; i++)
         {
            s = this.seglist[i];
            found1 = false;
            found2 = false;
            for(j = 0; j < this.seglist.length; j++)
            {
               if(i != j && found1 == false && (s.p1 == this.seglist[j].p1 || s.p1 == this.seglist[j].p2))
               {
                  found1 = true;
               }
               if(i != j && found2 == false && (s.p2 == this.seglist[j].p1 || s.p2 == this.seglist[j].p2))
               {
                  found2 = true;
               }
            }
            if(!found1 || !found2)
            {
               return false;
            }
         }
         return true;
      }
      
      protected function addDots(seg:Segment) : void
      {
         var dot:Dot = null;
         var seg1:QuadBezierSegment = null;
         var seg2:CubicBezierSegment = null;
         dot = this.addDot(seg.p1);
         if(dot.s1 == null && dot.s2 != seg)
         {
            dot.s1 = seg;
         }
         else if(dot.s2 == null && dot.s1 != seg)
         {
            dot.s2 = seg;
         }
         dot = this.addDot(seg.p2);
         if(dot.s1 == null && dot.s2 != seg)
         {
            dot.s1 = seg;
         }
         else if(dot.s2 == null && dot.s1 != seg)
         {
            dot.s2 = seg;
         }
         if(seg is QuadBezierSegment)
         {
            seg1 = seg as QuadBezierSegment;
            dot = this.addDot(seg1.c1);
            dot.c1 = seg1;
         }
         if(seg is CubicBezierSegment)
         {
            seg2 = seg as CubicBezierSegment;
            dot = this.addDot(seg2.c1);
            dot.c1 = seg2;
            dot = this.addDot(seg2.c2);
            dot.c2 = seg2;
         }
      }
      
      protected function addDot(point:Point) : Dot
      {
         var dot:Dot = this.getDot(point);
         if(dot == null)
         {
            dot = new Dot();
            dot.addEventListener(MouseEvent.MOUSE_OUT,this.pointOutAction);
            dot.addEventListener(MouseEvent.MOUSE_DOWN,this.pointDownAction);
            dot.addEventListener(MouseEvent.MOUSE_OVER,this.pointOverAction);
            dot.x = point.x * Global.zoom;
            dot.y = -point.y * Global.zoom;
            dot.point = point;
            this.dotlist.push(dot);
            return dot;
         }
         return dot;
      }
      
      protected function checkDot(lx:Number, ly:Number) : void
      {
         var sx:Number = NaN;
         var sy:Number = NaN;
         var dot:Dot = null;
         for(var i:* = 0; i < this.seglist.length; i++)
         {
            dot = null;
            sx = this.seglist[i].p1.x * Global.zoom;
            sy = -this.seglist[i].p1.y * Global.zoom;
            if(lx > sx - 8 && lx < sx + 8 && (ly > sy - 8 && ly < sy + 8))
            {
               dot = this.getDot(this.seglist[i].p1);
            }
            sx = this.seglist[i].p2.x * Global.zoom;
            sy = -this.seglist[i].p2.y * Global.zoom;
            if(lx > sx - 8 && lx < sx + 8 && (ly > sy - 8 && ly < sy + 8))
            {
               dot = this.getDot(this.seglist[i].p2);
            }
            if(dot != null)
            {
               addChild(dot);
            }
         }
      }
      
      protected function checkDotSketch(lx:Number, ly:Number) : void
      {
         var sx:Number = NaN;
         var sy:Number = NaN;
         var dot:Dot = null;
         var op:Array = this.openArray();
         for(var i:int = 0; i < op.length; i++)
         {
            sx = op[i].x * Global.zoom;
            sy = -op[i].y * Global.zoom;
            if(lx > sx - 8 && lx < sx + 8 && (ly > sy - 8 && ly < sy + 8))
            {
               dot = this.getDot(op[i]);
               dot.setSketch();
               dot.addEventListener(MouseEvent.MOUSE_DOWN,this.sketchPointDown);
               dot.addEventListener(MouseEvent.MOUSE_OUT,this.sketchPointOut);
               dot.looppath = this;
               addChild(dot);
            }
         }
      }
      
      protected function sketchPointDown(e:MouseEvent) : void
      {
         e.stopPropagation();
         var main:* = this.parent.parent;
         main.startSketch(e);
         var sketchdot:Dot = e.target as Dot;
         if(sketchdot != null && contains(sketchdot))
         {
            removeChild(sketchdot);
         }
      }
      
      protected function sketchPointOut(e:MouseEvent) : void
      {
         var sketchdot:Dot = e.target as Dot;
         if(sketchdot != null)
         {
            sketchdot.setInactive();
            sketchdot.removeEventListener(MouseEvent.MOUSE_DOWN,this.sketchPointDown);
            sketchdot.removeEventListener(MouseEvent.MOUSE_OUT,this.sketchPointOut);
         }
         if(sketchdot != null && contains(sketchdot))
         {
            removeChild(sketchdot);
         }
      }
      
      protected function setLineStyle(style:int) : void
      {
         var seg:* = undefined;
         this.linestyle = style;
         for each(seg in this.seglist)
         {
            seg.setLineStyle(style);
         }
      }
      
      protected function overAction(e:MouseEvent) : void
      {
         if(Global.tool == 3 && Global.dragging == false && Global.space == false)
         {
            this.checkDot(this.mouseX,this.mouseY);
         }
         else if(Global.tool == 1 && Global.dragging == false && Global.space == false)
         {
            this.checkDotSketch(this.mouseX,this.mouseY);
         }
      }
      
      protected function downAction(e:MouseEvent) : void
      {
         if((Global.tool == 0 || Global.tool == 3) && Global.space == false)
         {
            Global.dragging = true;
         }
      }
      
      protected function moveAction(e:MouseEvent) : void
      {
         if(Global.tool == 3 && Global.dragging == false && Global.space == false && e.target == this)
         {
            this.checkDot(this.mouseX,this.mouseY);
         }
         else if(Global.tool == 1 && Global.dragging == false && Global.space == false)
         {
            this.checkDotSketch(this.mouseX,this.mouseY);
         }
      }
      
      protected function upAction(e:MouseEvent) : void
      {
         if(Global.tool == 0 || Global.tool == 3)
         {
            Global.dragging = false;
            this.clearInactive();
         }
      }
      
      public function setActive() : void
      {
         this.active = true;
         this.redraw();
      }
      
      public function setInactive() : void
      {
         this.active = false;
         this.redraw();
      }
      
      public function redraw(seg:Segment = null) : void
      {
         var i:int = 0;
         var dot:Dot = null;
         var seg1:CubicBezierSegment = null;
         var seg2:QuadBezierSegment = null;
         var seg3:ArcSegment = null;
         if(seg == null)
         {
            this.renderClear();
            if(this.active == false)
            {
               this.setLineStyle(0);
            }
            else
            {
               this.setLineStyle(1);
            }
            if(Global.tool == 3)
            {
               for each(dot in this.dotlist)
               {
                  dot.x = dot.point.x * Global.zoom;
                  dot.y = -dot.point.y * Global.zoom;
               }
            }
            this.render();
         }
         else
         {
            seg.graphics.clear();
            if(this.active == false)
            {
               seg.setLineStyle(0);
            }
            else
            {
               seg.setLineStyle(1);
            }
            if(seg is CubicBezierSegment)
            {
               seg1 = seg as CubicBezierSegment;
               this.renderCubic(seg1);
            }
            else if(seg is QuadBezierSegment)
            {
               seg2 = seg as QuadBezierSegment;
               this.renderQuad(seg2);
            }
            else if(seg is ArcSegment)
            {
               seg3 = seg as ArcSegment;
               this.renderArc(seg3);
            }
            else
            {
               this.renderLine(seg);
            }
            if(Global.tool == 3)
            {
               for each(dot in this.dotlist)
               {
                  if(dot != null && (Boolean(dot.point == seg.p1 || dot.point == seg.p2) || Boolean(seg2 && dot.point == seg2.c1) || Boolean(seg1) && (Boolean(dot.point == seg1.c1 || dot.point == seg1.c2))))
                  {
                     dot.x = dot.point.x * Global.zoom;
                     dot.y = -dot.point.y * Global.zoom;
                  }
               }
            }
         }
      }
      
      public function renderClear() : void
      {
         var seg:* = undefined;
         for each(seg in this.seglist)
         {
            seg.graphics.clear();
         }
      }
      
      public function clearDots() : void
      {
         var item:* = undefined;
         var obj:Object = null;
         var removelist:Array = new Array();
         for(var i:int = 0; i < numChildren; i++)
         {
            obj = getChildAt(i);
            if(!(obj is Segment))
            {
               removelist.push(obj);
            }
         }
         for each(item in removelist)
         {
            removeChild(item);
         }
      }
      
      protected function clearInactive() : void
      {
         var dot:Dot = null;
         var removelist:Array = new Array();
         for(var i:int = 0; i < numChildren; i++)
         {
            if(getChildAt(i) is Dot)
            {
               dot = getChildAt(i) as Dot;
               if(dot.active == false)
               {
                  removelist.push(dot);
               }
               else if(Boolean(dot.c1) && dot.c1.active == false)
               {
                  removelist.push(dot);
               }
               else if(Boolean(dot.c2) && dot.c2.active == false)
               {
                  removelist.push(dot);
               }
            }
         }
         for(i = 0; i < removelist.length; i++)
         {
            removeChild(removelist[i]);
         }
      }
      
      public function setDotsInactive() : void
      {
         var dot:* = undefined;
         for each(dot in this.dotlist)
         {
            if((!dot.s1 || dot.s1.active == false) && (!dot.s2 || dot.s2.active == false) && (!dot.c1 || dot.c1.active == false) && (!dot.c2 || dot.c2.active == false))
            {
               dot.setInactive();
            }
         }
      }
      
      public function redrawDots() : void
      {
         var seg:* = undefined;
         var dot:* = undefined;
         while(this.dotlist.length > 0)
         {
            dot = this.dotlist.shift();
            if(contains(dot))
            {
               removeChild(dot);
            }
         }
         for each(seg in this.seglist)
         {
            this.addDots(seg);
         }
      }
      
      protected function deleteDots(seg:Segment) : void
      {
         var dot:Dot = null;
         var seg1:QuadBezierSegment = null;
         var seg2:CubicBezierSegment = null;
         dot = this.getDot(seg.p1);
         if(dot.s2 == null)
         {
            this.deleteDot(dot);
         }
         else
         {
            dot.s1 = null;
         }
         dot = this.getDot(seg.p2);
         if(dot.s1 == null)
         {
            this.deleteDot(dot);
         }
         else
         {
            dot.s2 = null;
         }
         if(seg is QuadBezierSegment)
         {
            seg1 = seg as QuadBezierSegment;
            this.deleteDot(this.getDot(seg1.c1));
         }
         if(seg is CubicBezierSegment)
         {
            seg2 = seg as CubicBezierSegment;
            this.deleteDot(this.getDot(seg2.c1));
            this.deleteDot(this.getDot(seg2.c2));
         }
      }
      
      protected function deleteDot(dot:Dot) : void
      {
         if(dot != null && contains(dot))
         {
            removeChild(dot);
         }
         var index:int = this.dotlist.indexOf(dot);
         if(index != -1)
         {
            this.dotlist.splice(index,1);
         }
      }
      
      public function setSegmentsInactive() : void
      {
         for(var i:int = 0; i < this.seglist.length; i++)
         {
            this.seglist[i].active = false;
         }
      }
      
      protected function addQuadControls(seg:QuadBezierSegment) : void
      {
         var dot:Dot = null;
         if(seg.active == true)
         {
            dot = this.getDot(seg.c1);
            dot.c1.active = true;
            dot.setActive();
            addChild(dot);
         }
      }
      
      protected function renderQuadGuides(seg:QuadBezierSegment) : void
      {
         var tempstyle:* = seg.linestyle;
         seg.setLineStyle(2);
         seg.graphics.moveTo(seg.p1.x * Global.zoom,-seg.p1.y * Global.zoom);
         seg.graphics.lineTo(seg.c1.x * Global.zoom,-seg.c1.y * Global.zoom);
         seg.setLineStyle(tempstyle);
      }
      
      protected function addCubicControls(seg:CubicBezierSegment) : void
      {
         var dot:Dot = null;
         if(seg.active == true)
         {
            dot = this.getDot(seg.c1);
            dot.c1.active = true;
            dot.setActive();
            addChild(dot);
            dot = this.getDot(seg.c2);
            dot.c2.active = true;
            dot.setActive();
            addChild(dot);
         }
      }
      
      protected function renderCubicGuides(seg:CubicBezierSegment) : void
      {
         var tempstyle:* = seg.linestyle;
         seg.setLineStyle(2);
         seg.graphics.moveTo(seg.p1.x * Global.zoom,-seg.p1.y * Global.zoom);
         seg.graphics.lineTo(seg.c1.x * Global.zoom,-seg.c1.y * Global.zoom);
         seg.graphics.moveTo(seg.p2.x * Global.zoom,-seg.p2.y * Global.zoom);
         seg.graphics.lineTo(seg.c2.x * Global.zoom,-seg.c2.y * Global.zoom);
         seg.setLineStyle(tempstyle);
      }
      
      protected function clearControls(dot:Dot) : void
      {
      }
      
      protected function unsetDotsCurrent() : void
      {
         var dot:Dot = null;
         for(var i:* = 0; i < numChildren; i++)
         {
            if(getChildAt(i) is Dot)
            {
               dot = getChildAt(i) as Dot;
               dot.unsetCurrent();
            }
         }
         if(this.coord != null && this.parent.contains(this.coord))
         {
            this.parent.removeChild(this.coord);
         }
      }
      
      protected function pointOutAction(e:MouseEvent) : void
      {
         this.clearInactive();
      }
      
      protected function pointOverAction(e:MouseEvent) : void
      {
         var dot:Dot = null;
         if(Global.tool == 3 && Global.dragging == false)
         {
            e.stopPropagation();
            dot = e.target as Dot;
            if(this.dragging && dot.current)
            {
               this.pointManipulatorUpdate(dot);
            }
         }
      }
      
      protected function pointDownAction(e:MouseEvent) : void
      {
         var dot:Dot = null;
         var main:* = undefined;
         if(Global.tool == 3)
         {
            this.cacheAsBitmap = false;
            e.target.addEventListener(MouseEvent.MOUSE_MOVE,this.pointMoveAction);
            e.target.addEventListener(MouseEvent.MOUSE_UP,this.pointUpAction);
            e.target.removeEventListener(MouseEvent.MOUSE_OUT,this.pointOutAction);
            dot = e.target as Dot;
            this.xstart = this.mouseX;
            this.ystart = this.mouseY;
            addChild(dot);
            this.startpoint = dot.point.clone();
            this.dragging = true;
            Global.dragging = true;
            e.target.startDrag();
            this.setSegmentsInactive();
            this.setInactive();
            if(dot.s1 != null)
            {
               dot.s1.active = true;
            }
            if(dot.s2 != null)
            {
               dot.s2.active = true;
            }
            if(dot.c1 != null)
            {
               dot.c1.active = true;
            }
            if(dot.c2 != null)
            {
               dot.c2.active = true;
            }
            this.setDotsInactive();
            e.target.setActive();
            e.target.setDragging();
            this.clearInactive();
            if(e.target.c1 == null && e.target.c2 == null)
            {
               this.clearControls(dot);
            }
            this.addCoord(dot);
            if(e.target.s1 is QuadBezierSegment)
            {
               e.target.s1.active = true;
               this.addQuadControls(e.target.s1);
            }
            if(e.target.s2 is QuadBezierSegment)
            {
               e.target.s2.active = true;
               this.addQuadControls(e.target.s2);
            }
            if(e.target.s1 is CubicBezierSegment)
            {
               e.target.s1.active = true;
               this.addCubicControls(e.target.s1);
            }
            if(e.target.s2 is CubicBezierSegment)
            {
               e.target.s2.active = true;
               this.addCubicControls(e.target.s2);
            }
            this.pointManipulatorUpdate(dot);
            main = this.parent;
            main.clearDots(this);
            main.addChild(this);
            this.startdot = new Shape();
            this.startdot.graphics.beginFill(0);
            this.startdot.graphics.drawRect(0,-6,1,13);
            this.startdot.graphics.drawRect(-6,0,13,1);
            this.startdot.graphics.endFill();
            this.startdot.x = this.startpoint.x * Global.zoom;
            this.startdot.y = -this.startpoint.y * Global.zoom;
            addChild(this.startdot);
         }
      }
      
      protected function pointUpAction(e:MouseEvent) : void
      {
         var scene:SceneGraph = null;
         var undo:UndoPointMove = null;
         e.stopPropagation();
         e.target.stopDrag();
         this.dragging = false;
         Global.dragging = false;
         e.target.unsetDragging();
         if(contains(this.startdot))
         {
            removeChild(this.startdot);
         }
         e.target.removeEventListener(MouseEvent.MOUSE_MOVE,this.pointMoveAction);
         e.target.removeEventListener(MouseEvent.MOUSE_UP,this.pointUpAction);
         e.target.addEventListener(MouseEvent.MOUSE_OUT,this.pointOutAction);
         var dot:Dot = e.target as Dot;
         if(Boolean(dot && dot.loop == true) && Boolean(dot.looppath != null) && dot.looppath != this)
         {
            this.mergePath(dot.looppath);
            dot.active = false;
            this.setInactive();
            this.clearInactive();
         }
         else if(Boolean(dot) && dot.loop == true)
         {
            dot.active = false;
            this.setInactive();
            this.clearInactive();
         }
         else
         {
            this.pointManipulatorUpdate(dot);
         }
         if(Boolean(dot) && Boolean(dot.loop == true) && Boolean(dot.looppoint))
         {
            if(Boolean(dot.s1) && Global.withinTolerance(dot.s1.p1,dot.looppoint,0.01))
            {
               dot.s1.p1 = dot.looppoint;
            }
            else if(Boolean(dot.s1) && Global.withinTolerance(dot.s1.p2,dot.looppoint,0.01))
            {
               dot.s1.p2 = dot.looppoint;
            }
            if(Boolean(dot.s2) && Global.withinTolerance(dot.s2.p1,dot.looppoint,0.01))
            {
               dot.s2.p1 = dot.looppoint;
            }
            else if(Boolean(dot.s2) && Global.withinTolerance(dot.s2.p2,dot.looppoint,0.01))
            {
               dot.s2.p2 = dot.looppoint;
            }
            this.redrawDots();
         }
         if(!dot.point.equals(this.startpoint))
         {
            scene = this.parent as SceneGraph;
            if(scene != null)
            {
               undo = new UndoPointMove(scene);
               undo.point = dot.point;
               undo.path = this;
               undo.undopoint = this.startpoint.clone();
               undo.redopoint = dot.point.clone();
               Global.undoPush(undo);
               scene.redrawCuts();
            }
            this.dirty = true;
            this.camdirty = true;
         }
         this.cacheAsBitmap = true;
      }
      
      public function pubPointUpAction() : void
      {
         var dot:Dot = null;
         for(var i:int = 0; i < numChildren; i++)
         {
            if(getChildAt(i) is Dot)
            {
               dot = getChildAt(i) as Dot;
               dot.stopDrag();
               dot.removeEventListener(MouseEvent.MOUSE_MOVE,this.pointMoveAction);
               this.dragging = false;
               Global.dragging = false;
            }
         }
      }
      
      protected function pointMoveAction(e:MouseEvent) : void
      {
         e.stopPropagation();
         var dot:Dot = e.target as Dot;
         if(dot.current == true && dot.active == true)
         {
            this.pointManipulatorUpdate(dot);
         }
      }
      
      protected function pointManipulatorUpdate(dot:Dot) : void
      {
         var xsnap:Number = NaN;
         var ysnap:Number = NaN;
         var xstartfixed:Number = NaN;
         var ystartfixed:Number = NaN;
         var pos:Point = null;
         var i:int = 0;
         var globalx:Number = NaN;
         var globaly:Number = NaN;
         var residualx:Number = NaN;
         var residualy:Number = NaN;
         var scene:* = undefined;
         var looppoint:Point = null;
         var xdelta:Number = (dot.x - this.xstart) / Global.zoom;
         var ydelta:Number = (dot.y - this.ystart) / Global.zoom;
         var xerror:Number = 12;
         var yerror:Number = 12;
         if(Math.abs(this.mouseX - this.xstart) < xerror)
         {
            xerror = Math.abs(this.mouseX - this.xstart);
            xsnap = this.startpoint.x;
         }
         if(Math.abs(this.mouseY - this.ystart) < yerror)
         {
            yerror = Math.abs(this.mouseY - this.ystart);
            ysnap = this.startpoint.y;
         }
         if(Global.localsnap == true)
         {
            for(i = 0; i < this.seglist.length; i++)
            {
               if(this.seglist[i].p2 != dot.point)
               {
                  xstartfixed = this.seglist[i].p2.x * Global.zoom;
                  ystartfixed = -this.seglist[i].p2.y * Global.zoom;
                  if(Math.abs(this.mouseX - xstartfixed) < xerror)
                  {
                     xerror = Math.abs(this.mouseX - xstartfixed);
                     xsnap = Number(this.seglist[i].p2.x);
                  }
                  if(Math.abs(this.mouseY - ystartfixed) < yerror)
                  {
                     yerror = Math.abs(this.mouseY - ystartfixed);
                     ysnap = Number(this.seglist[i].p2.y);
                  }
               }
            }
         }
         if(Global.snap == true)
         {
            globalx = this.mouseX / Global.zoom + this.docx;
            globaly = -this.mouseY / Global.zoom - this.docy;
            residualx = Math.abs(globalx - Math.round(globalx)) * Global.zoom;
            residualy = Math.abs(globaly - Math.round(globaly)) * Global.zoom;
            trace(residualx,residualy);
            if(residualx < xerror)
            {
               xerror = residualx;
               xsnap = Math.round(globalx) - this.docx;
            }
            if(residualy < yerror)
            {
               yerror = residualy;
               ysnap = Math.round(globaly) + this.docy;
            }
         }
         if(Boolean(dot) && (Boolean(dot.s1) && Boolean(!dot.s2) || Boolean(dot.s2) && Boolean(!dot.s1)))
         {
            scene = this.parent;
            looppoint = scene.closeLoop(dot);
            if(looppoint != null)
            {
               xerror = 0;
               yerror = 0;
               xsnap = looppoint.x;
               ysnap = looppoint.y;
               xsnap -= this.docx;
               ysnap += this.docy;
               dot.setLoop();
            }
            else
            {
               dot.unsetLoop();
            }
         }
         if(xerror < 12)
         {
            dot.x = xsnap * Global.zoom;
            dot.point.x = xsnap;
         }
         else
         {
            dot.x = this.mouseX;
            dot.point.x = this.mouseX / Global.zoom;
         }
         if(yerror < 12)
         {
            dot.y = ysnap * Global.zoom;
            dot.point.y = ysnap;
         }
         else
         {
            dot.y = this.mouseY;
            dot.point.y = -this.mouseY / Global.zoom;
         }
         pos = new Point(dot.point.x,dot.point.y);
         if(dot.s1 != null)
         {
            this.redraw(dot.s1);
         }
         if(dot.s2 != null)
         {
            this.redraw(dot.s2);
         }
         if(dot.c1 != null)
         {
            this.redraw(dot.c1);
         }
         if(dot.c2 != null)
         {
            this.redraw(dot.c2);
         }
         this.coordSetPos(pos);
      }
      
      protected function addCoord(dot:Dot) : void
      {
         this.unsetDotsCurrent();
         dot.setCurrent();
         this.coord = new coordinates();
         this.coord.x = this.xstart;
         this.coord.y = -this.ystart;
         this.coord.dot = dot;
         this.coord.xbox.restrict = "0-9.";
         this.coord.ybox.restrict = "0-9.";
         this.parent.addChild(this.coord);
         this.coord.addEventListener(MouseEvent.MOUSE_DOWN,this.coordDown);
         this.coord.addEventListener(MouseEvent.MOUSE_MOVE,this.coordMove);
         this.coord.addEventListener(MouseEvent.MOUSE_UP,this.coordUp);
         this.coord.xbox.addEventListener(Event.CHANGE,this.coordInput);
         this.coord.ybox.addEventListener(Event.CHANGE,this.coordInput);
      }
      
      protected function coordSetPos(pos:Point) : void
      {
         if(this.coord != null && pos != null)
         {
            this.coord.x = (pos.x + this.docx) * Global.zoom;
            this.coord.y = -(pos.y - this.docy) * Global.zoom;
            this.coord.xbox.text = Number(this.docx + pos.x).toFixed(4) + " " + Global.unit;
            this.coord.ybox.text = Number(-this.docy + pos.y).toFixed(4) + " " + Global.unit;
         }
      }
      
      protected function coordInput(e:Event) : void
      {
         var c:* = e.target.parent;
         var input:String = e.target.text;
         var inputnum:Number = Number(input.replace(/[^0-9-'.']/g,""));
         if(inputnum > 100)
         {
            inputnum = 100;
         }
         if(c.dot.parent != null)
         {
            if(e.target.name == "xbox")
            {
               inputnum -= c.dot.parent.docx;
               if(c.dot.point.x != inputnum)
               {
                  c.dot.x = inputnum * Global.zoom;
                  c.dot.point.x = inputnum;
                  this.dirty = true;
                  this.camdirty = true;
               }
            }
            else if(e.target.name == "ybox")
            {
               inputnum += c.dot.parent.docy;
               if(c.dot.point.y != inputnum)
               {
                  c.dot.y = inputnum * Global.zoom;
                  c.dot.point.y = inputnum;
                  this.dirty = true;
                  this.camdirty = true;
               }
            }
         }
         this.redraw();
      }
      
      protected function coordDown(e:MouseEvent) : void
      {
         e.stopPropagation();
      }
      
      protected function coordMove(e:MouseEvent) : void
      {
         e.stopPropagation();
      }
      
      protected function coordUp(e:MouseEvent) : void
      {
         e.stopPropagation();
      }
      
      protected function renderLine(seg:Segment, sprite:Sprite = null) : void
      {
         if(sprite == null)
         {
            sprite = seg;
         }
         sprite.graphics.moveTo(seg.p1.x * Global.zoom,-seg.p1.y * Global.zoom);
         sprite.graphics.lineTo(seg.p2.x * Global.zoom,-seg.p2.y * Global.zoom);
      }
      
      protected function renderCubic(seg:CubicBezierSegment, sprite:Sprite = null) : void
      {
         var bezier:Bezier = null;
         var tp1:Point = null;
         var tp2:Point = null;
         var tc1:Point = null;
         var quadP:Object = null;
         if(sprite == null)
         {
            sprite = seg;
         }
         if(seg.active)
         {
            this.renderCubicGuides(seg);
         }
         try
         {
            sprite.graphics.moveTo(seg.p1.x * Global.zoom,-seg.p1.y * Global.zoom);
            sprite.graphics.cubicCurveTo(seg.c1.x * Global.zoom,-seg.c1.y * Global.zoom,seg.c2.x * Global.zoom,-seg.c2.y * Global.zoom,seg.p2.x * Global.zoom,-seg.p2.y * Global.zoom);
         }
         catch(errObject:Error)
         {
            bezier = new Bezier(seg.p1,seg.c1,seg.c2,seg.p2);
            tp1 = seg.p1;
            for each(quadP in bezier.QPts)
            {
               tp2 = new Point(quadP.p.x,quadP.p.y);
               tc1 = new Point(quadP.c.x,quadP.c.y);
               renderQuad(new QuadBezierSegment(tp1,tp2,tc1),sprite);
               tp1 = tp2;
            }
         }
      }
      
      protected function renderQuad(seg:QuadBezierSegment, sprite:Sprite = null) : void
      {
         if(seg.active)
         {
            this.renderQuadGuides(seg);
         }
         if(sprite == null)
         {
            sprite = seg;
         }
         sprite.graphics.moveTo(seg.p1.x * Global.zoom,-seg.p1.y * Global.zoom);
         sprite.graphics.curveTo(seg.c1.x * Global.zoom,-seg.c1.y * Global.zoom,seg.p2.x * Global.zoom,-seg.p2.y * Global.zoom);
      }
      
      protected function renderArc(seg:ArcSegment, sprite:Sprite = null) : void
      {
         var ellipticalArc:Object = seg.computeSvgArc();
         this.drawEllipticalArc(seg,seg.p2,ellipticalArc.cx,ellipticalArc.cy,ellipticalArc.startAngle,ellipticalArc.arc,ellipticalArc.radius,ellipticalArc.yRadius,ellipticalArc.xAxisRotation,sprite);
      }
      
      protected function drawEllipticalArc(seg:Segment, startpoint:Point, x:Number, y:Number, startAngle:Number, arc:Number, radius:Number, yRadius:Number, xAxisRotation:Number = 0, sprite:Sprite = null) : void
      {
         var beta:Number = NaN;
         var sinbeta:Number = NaN;
         var cosbeta:Number = NaN;
         var cx:Number = NaN;
         var cy:Number = NaN;
         var x1:Number = NaN;
         var y1:Number = NaN;
         var tp1:Point = null;
         var tp2:Point = null;
         var tc1:Point = null;
         var i:int = 0;
         var sinangle:Number = NaN;
         var cosangle:Number = NaN;
         var div:Number = NaN;
         if(sprite == null)
         {
            sprite = seg;
         }
         if(Math.abs(arc) > 360)
         {
            arc = 360;
         }
         var segs:Number = Math.ceil(Math.abs(arc) / 45);
         var segAngle:Number = arc / segs;
         var theta:Number = degreesToRadians(segAngle);
         var angle:Number = degreesToRadians(startAngle);
         if(segs > 0)
         {
            beta = degreesToRadians(xAxisRotation);
            sinbeta = Math.sin(beta);
            cosbeta = Math.cos(beta);
            tp1 = startpoint;
            for(i = 0; i < segs; i++)
            {
               angle += theta;
               sinangle = Math.sin(angle - theta / 2);
               cosangle = Math.cos(angle - theta / 2);
               div = Math.cos(theta / 2);
               cx = x + (radius * cosangle * cosbeta - yRadius * sinangle * sinbeta) / div;
               cy = y + (radius * cosangle * sinbeta + yRadius * sinangle * cosbeta) / div;
               sinangle = Math.sin(angle);
               cosangle = Math.cos(angle);
               x1 = x + (radius * cosangle * cosbeta - yRadius * sinangle * sinbeta);
               y1 = y + (radius * cosangle * sinbeta + yRadius * sinangle * cosbeta);
               tp2 = new Point(x1,y1);
               tc1 = new Point(cx,cy);
               this.renderQuad(new QuadBezierSegment(tp1,tp2,tc1),sprite);
               tp1 = tp2;
            }
         }
      }
      
      public function inchToCm() : void
      {
         this.unitConvert(2.54);
      }
      
      public function cmToInch() : void
      {
         this.unitConvert(1 / 2.54);
      }
      
      public function unitConvert(factor:Number) : void
      {
         var seg:Segment = null;
         this.docx *= factor;
         this.docy *= factor;
         var transformed:Array = new Array();
         for(var i:int = 0; i < this.seglist.length; i++)
         {
            seg = this.seglist[i];
            if(Boolean(seg.p1) && transformed.indexOf(seg.p1) == -1)
            {
               seg.p1.x *= factor;
               seg.p1.y *= factor;
               transformed.push(seg.p1);
            }
            if(Boolean(seg.p2) && transformed.indexOf(seg.p2) == -1)
            {
               seg.p2.x *= factor;
               seg.p2.y *= factor;
               transformed.push(seg.p2);
            }
            if((Boolean(seg is QuadBezierSegment || seg is CubicBezierSegment)) && Boolean(this.seglist[i].c1) && transformed.indexOf(this.seglist[i].c1) == -1)
            {
               this.seglist[i].c1.x *= factor;
               this.seglist[i].c1.y *= factor;
               transformed.push(this.seglist[i].c1);
            }
            if(Boolean(seg is CubicBezierSegment) && Boolean(this.seglist[i].c2) && transformed.indexOf(this.seglist[i].c2) == -1)
            {
               this.seglist[i].c2.x *= factor;
               this.seglist[i].c2.y *= factor;
               transformed.push(this.seglist[i].c2);
            }
            if(seg is CircularArc)
            {
               this.seglist[i].center.x *= factor;
               this.seglist[i].center.y *= factor;
               this.seglist[i].radius *= factor;
            }
            if(seg is ArcSegment)
            {
               this.seglist[i].rx *= factor;
               this.seglist[i].ry *= factor;
            }
         }
         this.redrawDots();
      }
      
      public function deleteActive() : Boolean
      {
         var i:* = 0;
         while(i < this.seglist.length)
         {
            if(this.seglist[i].active == true)
            {
               if(contains(this.seglist[i]))
               {
                  removeChild(this.seglist[i]);
               }
               this.seglist.splice(i,1);
               i--;
            }
            i++;
         }
         this.redrawDots();
         this.setInactive();
         if(this.seglist.length == 0)
         {
            return true;
         }
         return false;
      }
      
      public function snapPoint(dot:Dot) : Point
      {
         var seg:Segment = null;
         var globalpoint:Point = null;
         var snappoint:Point = null;
         var i:int = 0;
         var parentpath:Path = null;
         var globalpos:Point = null;
         var op:Array = null;
         var self:Boolean = false;
         var dis:Number = NaN;
         if(dot)
         {
            parentpath = dot.parent as Path;
            globalpos = new Point(parentpath.mouseX / Global.zoom + parentpath.docx,-parentpath.mouseY / Global.zoom - parentpath.docy);
            op = this.openArray(dot);
            for(i = 0; i < op.length; i++)
            {
               globalpoint = new Point(op[i].x + this.docx,op[i].y - this.docy);
               self = false;
               if(dot.point == op[i])
               {
                  self = true;
               }
               dis = Point.distance(globalpos,globalpoint) * Global.zoom;
               if(Global.unit == "cm")
               {
                  dis *= 2.54;
               }
               if(self == false && dis < 20)
               {
                  dot.looppoint = op[i];
                  return globalpoint;
               }
            }
         }
         return null;
      }
      
      protected function openArray(dot:Dot = null) : Array
      {
         var p1open:* = undefined;
         var p2open:* = undefined;
         var j:int = 0;
         var openarray:Array = new Array();
         for(var i:int = 0; i < this.seglist.length; i++)
         {
            p1open = true;
            p2open = true;
            for(j = 0; j < this.seglist.length; j++)
            {
               if((dot == null || dot.looppoint == null || !this.seglist[i].p1.equals(dot.looppoint)) && (Boolean(this.seglist[i].p1.equals(this.seglist[j].p1)) && Boolean(i != j) || Boolean(this.seglist[i].p1.equals(this.seglist[j].p2))))
               {
                  p1open = false;
               }
               if((dot == null || dot.looppoint == null || !this.seglist[i].p2.equals(dot.looppoint)) && (Boolean(this.seglist[i].p2.equals(this.seglist[j].p1)) || Boolean(this.seglist[i].p2.equals(this.seglist[j].p2)) && Boolean(i != j)))
               {
                  p2open = false;
               }
            }
            if(p1open)
            {
               openarray.push(this.seglist[i].p1);
            }
            if(p2open)
            {
               openarray.push(this.seglist[i].p2);
            }
         }
         return openarray;
      }
      
      public function mergePath(p:Path, point:Point = null, doubles:Boolean = true) : void
      {
         var newseg:* = undefined;
         var seg1:QuadBezierSegment = null;
         var seg2:CubicBezierSegment = null;
         var dx:Number = p.docx;
         var dy:Number = p.docy;
         var newseglist:Array = p.deletePath();
         var transformed:Array = new Array();
         for(var i:int = 0; i < newseglist.length; i++)
         {
            if(Boolean(newseglist[i].p1) && transformed.indexOf(newseglist[i].p1) == -1)
            {
               newseglist[i].p1.x = newseglist[i].p1.x + dx - this.docx;
               newseglist[i].p1.y = newseglist[i].p1.y - dy + this.docy;
               transformed.push(newseglist[i].p1);
            }
            if(Boolean(newseglist[i].p2) && transformed.indexOf(newseglist[i].p2) == -1)
            {
               newseglist[i].p2.x = newseglist[i].p2.x + dx - this.docx;
               newseglist[i].p2.y = newseglist[i].p2.y - dy + this.docy;
               transformed.push(newseglist[i].p2);
            }
            if(newseglist[i] is QuadBezierSegment)
            {
               seg1 = newseglist[i] as QuadBezierSegment;
               seg1.c1.x = seg1.c1.x + dx - this.docx;
               seg1.c1.y = seg1.c1.y + dy - this.docy;
            }
            if(newseglist[i] is CubicBezierSegment)
            {
               seg2 = newseglist[i] as CubicBezierSegment;
               seg2.c1.x = seg2.c1.x + dx - this.docx;
               seg2.c1.y = seg2.c1.y + dy - this.docy;
               seg2.c2.x = seg2.c2.x + dx - this.docx;
               seg2.c2.y = seg2.c2.y + dy - this.docy;
            }
         }
         if(point)
         {
            newseglist[0].p1 = point;
         }
         for each(newseg in newseglist)
         {
            this.addSegment(newseg);
         }
         if(doubles)
         {
            this.removeDoubles();
         }
      }
      
      protected function removeDoubles() : void
      {
         var j:int = 0;
         var removelist:Array = new Array();
         for(var i:int = 0; i < this.seglist.length; i++)
         {
            for(j = i; j < this.seglist.length; j++)
            {
               if(Boolean(i != j) && Boolean(this.seglist[i].p1.equals(this.seglist[j].p1)) && Boolean(this.seglist[i].p2.equals(this.seglist[j].p2)))
               {
                  if(removelist.indexOf(this.seglist[i]) == -1)
                  {
                     removelist.push(j);
                  }
               }
            }
         }
         for(i = 0; i < removelist.length; i++)
         {
            this.seglist.splice(removelist[i],1);
         }
      }
      
      public function joinDoubles(tol:Number = 0.05, rejoin:Boolean = false) : void
      {
         var j:int = 0;
         var joined:Array = new Array();
         for(var i:int = 0; i < this.seglist.length; i++)
         {
            for(j = 0; j < this.seglist.length; j++)
            {
               if(i != j)
               {
                  if(Boolean(this.seglist[i].p1 && this.seglist[j].p1 && this.seglist[i].p1 != this.seglist[j].p1 && joined.indexOf(this.seglist[i].p1) == -1) && Boolean(joined.indexOf(this.seglist[j].p1) == -1) && Global.withinTolerance(this.seglist[i].p1,this.seglist[j].p1,tol))
                  {
                     this.seglist[i].p1 = this.seglist[j].p1;
                     joined.push(this.seglist[i].p1);
                  }
                  if(Boolean(this.seglist[i].p1 && this.seglist[j].p2 && this.seglist[i].p1 != this.seglist[j].p2 && joined.indexOf(this.seglist[i].p1) == -1) && Boolean(joined.indexOf(this.seglist[j].p2) == -1) && Global.withinTolerance(this.seglist[i].p1,this.seglist[j].p2,tol))
                  {
                     this.seglist[i].p1 = this.seglist[j].p2;
                     joined.push(this.seglist[i].p1);
                  }
                  if(Boolean(this.seglist[i].p2 && this.seglist[j].p1 && this.seglist[i].p2 != this.seglist[j].p1 && joined.indexOf(this.seglist[i].p2) == -1) && Boolean(joined.indexOf(this.seglist[j].p1) == -1) && Global.withinTolerance(this.seglist[i].p2,this.seglist[j].p1,tol))
                  {
                     this.seglist[i].p2 = this.seglist[j].p1;
                     joined.push(this.seglist[i].p2);
                  }
                  if(Boolean(this.seglist[i].p2 && this.seglist[j].p2 && this.seglist[i].p2 != this.seglist[j].p2 && joined.indexOf(this.seglist[i].p2) == -1) && Boolean(joined.indexOf(this.seglist[j].p2) == -1) && Global.withinTolerance(this.seglist[i].p2,this.seglist[j].p2,tol))
                  {
                     this.seglist[i].p2 = this.seglist[j].p2;
                     joined.push(this.seglist[i].p2);
                  }
               }
            }
         }
      }
      
      public function deletePath() : Array
      {
         var i:int = 0;
         var main:* = this.parent;
         if(main)
         {
            if(main.contains(this))
            {
               main.removeChild(this);
            }
            i = int(main.pathlist.indexOf(this));
            if(i != -1)
            {
               main.pathlist.splice(main.pathlist.indexOf(this),1);
            }
         }
         return this.seglist;
      }
      
      public function getNumSeg() : int
      {
         return this.seglist.length;
      }
      
      public function matrixTransform(m:Matrix) : void
      {
         var seg:Segment = null;
         var p:Point = null;
         var sx:Number = NaN;
         var sy:Number = NaN;
         var angle:Number = NaN;
         var id:Matrix = new Matrix();
         id.identity();
         if(id == m)
         {
            return;
         }
         this.dirty = true;
         this.camdirty = true;
         var transformed:Array = new Array();
         for(var i:int = 0; i < this.seglist.length; i++)
         {
            seg = this.seglist[i];
            if(Boolean(seg.p1) && transformed.indexOf(seg.p1) == -1)
            {
               p = m.transformPoint(seg.p1);
               seg.p1.x = p.x;
               seg.p1.y = p.y;
               transformed.push(seg.p1);
            }
            if(Boolean(seg.p2) && transformed.indexOf(seg.p2) == -1)
            {
               p = m.transformPoint(seg.p2);
               seg.p2.x = p.x;
               seg.p2.y = p.y;
               transformed.push(seg.p2);
            }
            if((this.seglist[i] is QuadBezierSegment || this.seglist[i] is CubicBezierSegment) && Boolean(this.seglist[i].c1))
            {
               p = m.transformPoint(this.seglist[i].c1);
               this.seglist[i].c1.x = p.x;
               this.seglist[i].c1.y = p.y;
            }
            if(this.seglist[i] is CubicBezierSegment && Boolean(this.seglist[i].c2))
            {
               p = m.transformPoint(this.seglist[i].c2);
               this.seglist[i].c2.x = p.x;
               this.seglist[i].c2.y = p.y;
            }
            if(this.seglist[i] is ArcSegment)
            {
               sx = Math.sqrt(m.a * m.a + m.b * m.b);
               sy = Math.sqrt(m.c * m.c + m.d * m.d);
               angle = Math.acos(m.a / sx) * 180 / Math.PI;
               this.seglist[i].rx *= sx;
               this.seglist[i].ry *= sy;
               this.seglist[i].angle += angle;
            }
         }
      }
      
      public function getMax() : Point
      {
         var maxx:Number = 0;
         var maxy:Number = 0;
         for(var i:int = 0; i < this.seglist.length; i++)
         {
            if(this.seglist[i].p1.x > maxx)
            {
               maxx = Number(this.seglist[i].p1.x);
            }
            if(this.seglist[i].p2.x > maxx)
            {
               maxx = Number(this.seglist[i].p2.x);
            }
            if(this.seglist[i] is QuadBezierSegment || this.seglist[i] is CubicBezierSegment)
            {
               if(this.seglist[i].c1.x > maxx)
               {
                  maxx = Number(this.seglist[i].c1.x);
               }
            }
            if(this.seglist[i] is CubicBezierSegment)
            {
               if(this.seglist[i].c2.x > maxx)
               {
                  maxx = Number(this.seglist[i].c2.x);
               }
            }
            if(this.seglist[i].p1.y > maxy)
            {
               maxy = Number(this.seglist[i].p1.y);
            }
            if(this.seglist[i].p2.y > maxy)
            {
               maxy = Number(this.seglist[i].p2.y);
            }
            if(this.seglist[i] is QuadBezierSegment || this.seglist[i] is CubicBezierSegment)
            {
               if(this.seglist[i].c1.y > maxy)
               {
                  maxy = Number(this.seglist[i].c1.y);
               }
            }
            if(this.seglist[i] is CubicBezierSegment)
            {
               if(this.seglist[i].c2.y > maxy)
               {
                  maxy = Number(this.seglist[i].c2.y);
               }
            }
         }
         return new Point(this.docx + maxx,-this.docy + maxy);
      }
      
      public function getMin() : Point
      {
         var minx:Number = Number(this.seglist[0].p1.x);
         var miny:Number = Number(this.seglist[0].p1.y);
         for(var i:int = 0; i < this.seglist.length; i++)
         {
            if(this.seglist[i].p1.x < minx)
            {
               minx = Number(this.seglist[i].p1.x);
            }
            if(this.seglist[i].p2.x < minx)
            {
               minx = Number(this.seglist[i].p2.x);
            }
            if(this.seglist[i].p1.y < miny)
            {
               miny = Number(this.seglist[i].p1.x);
            }
            if(this.seglist[i].p2.y < miny)
            {
               miny = Number(this.seglist[i].p2.y);
            }
         }
         return new Point(this.docx + minx,-this.docy + miny);
      }
      
      public function getAverage() : Point
      {
         var average:Point = new Point(0,0);
         var counted:Array = new Array();
         for(var i:int = 0; i < this.seglist.length; i++)
         {
            if(counted.indexOf(this.seglist[i].p1) == -1)
            {
               average.x += this.seglist[i].p1.x + this.docx;
               average.y += this.seglist[i].p1.y - this.docy;
               counted.push(this.seglist[i].p1);
            }
            if(counted.indexOf(this.seglist[i].p2) == -1)
            {
               average.x += this.seglist[i].p2.x + this.docx;
               average.y += this.seglist[i].p2.y - this.docy;
               counted.push(this.seglist[i].p2);
            }
         }
         average.x /= this.seglist.length;
         average.y /= this.seglist.length;
         return average;
      }
      
      public function clone() : Path
      {
         if(this.seglist.length < 1)
         {
            return null;
         }
         var newpath:Path = new Path();
         newpath.docx = this.docx;
         newpath.docy = this.docy;
         for(var i:int = 0; i < this.seglist.length; i++)
         {
            if(this.seglist[i] is QuadBezierSegment)
            {
               newpath.addSegment(new QuadBezierSegment(this.seglist[i].p1.clone(),this.seglist[i].p2.clone(),this.seglist[i].c1.clone()));
            }
            else if(this.seglist[i] is CubicBezierSegment)
            {
               newpath.addSegment(new CubicBezierSegment(this.seglist[i].p1.clone(),this.seglist[i].p2.clone(),this.seglist[i].c1.clone(),this.seglist[i].c2.clone()));
            }
            else if(this.seglist[i] is ArcSegment)
            {
               newpath.addSegment(new ArcSegment(this.seglist[i].p1.clone(),this.seglist[i].p2.clone(),this.seglist[i].rx,this.seglist[i].ry,this.seglist[i].angle,this.seglist[i].lf,this.seglist[i].sf));
            }
            else if(this.seglist[i] is Segment)
            {
               newpath.addSegment(new Segment(this.seglist[i].p1.clone(),this.seglist[i].p2.clone()));
            }
         }
         newpath.joinDoubles();
         return newpath;
      }
      
      public function zeroOrigin() : void
      {
         var p:Point = null;
         if(this.docx == 0 && this.docy == 0)
         {
            return;
         }
         var processed:Array = new Array();
         for(var i:int = 0; i < this.seglist.length; i++)
         {
            p = this.seglist[i].p1;
            if(processed.indexOf(p) == -1)
            {
               p.x += this.docx;
               p.y -= this.docy;
               processed.push(p);
            }
            p = this.seglist[i].p2;
            if(processed.indexOf(p) == -1)
            {
               p.x += this.docx;
               p.y -= this.docy;
               processed.push(p);
            }
            if(this.seglist[i] is CubicBezierSegment)
            {
               this.seglist[i].c1.x += this.docx;
               this.seglist[i].c1.y -= this.docy;
               this.seglist[i].c2.x += this.docx;
               this.seglist[i].c2.y -= this.docy;
            }
            else if(this.seglist[i] is QuadBezierSegment)
            {
               this.seglist[i].c1.x += this.docx;
               this.seglist[i].c1.y -= this.docy;
            }
            else if(this.seglist[i] is CircularArc)
            {
               this.seglist[i].center.x += this.docx;
               this.seglist[i].center.y -= this.docy;
            }
         }
         processed = null;
         this.docx = 0;
         this.docy = 0;
         x = 0;
         y = 0;
      }
      
      public function linearize(circle:Boolean = false) : Array
      {
         var nextindex:int = 0;
         var cub:CubicBezierSegment = null;
         var c1:Point = null;
         var c2:Point = null;
         var angle:Number = NaN;
         var newseglist:Array = new Array();
         for(var i:* = 0; i < this.seglist.length; i++)
         {
            if(this.seglist[i] is QuadBezierSegment || this.seglist[i] is CubicBezierSegment)
            {
               if(this.seglist[i] is CubicBezierSegment)
               {
                  cub = this.seglist[i] as CubicBezierSegment;
                  if(Global.withinTolerance(cub.p1,cub.p2))
                  {
                     c1 = new Point(cub.c1.x - cub.p1.x,cub.c1.y - cub.p1.y);
                     c2 = new Point(cub.c2.x - cub.p2.x,cub.c2.y - cub.p2.y);
                     angle = Global.getAngle(c1,c2);
                     if(Math.abs(angle) >= 0.5 * Math.PI)
                     {
                        nextindex = i + 1;
                        if(nextindex == this.seglist.length)
                        {
                           nextindex = 0;
                        }
                        this.seglist[nextindex].p1 = cub.p1;
                        this.seglist.splice(i,1);
                        i--;
                        continue;
                     }
                  }
               }
               newseglist = newseglist.concat(this.seglist[i].linearize(circle));
            }
            else if(this.seglist[i] is CircularArc)
            {
               newseglist.push(new CircularArc(this.seglist[i].p1,this.seglist[i].p2,this.seglist[i].center.clone(),this.seglist[i].radius));
            }
            else if(this.seglist[i] is ArcSegment)
            {
               if(this.seglist[i].lf == false && Global.withinTolerance(this.seglist[i].p1,this.seglist[i].p2))
               {
                  nextindex = i + 1;
                  if(nextindex == this.seglist.length)
                  {
                     nextindex = 0;
                  }
                  this.seglist[nextindex].p1 = this.seglist[i].p1;
                  this.seglist.splice(i,1);
                  i--;
               }
               else
               {
                  newseglist = newseglist.concat(this.seglist[i].linearize(circle));
               }
            }
            else if(this.seglist[i] is Segment)
            {
               if(Global.withinTolerance(this.seglist[i].p1,this.seglist[i].p2))
               {
                  nextindex = i + 1;
                  if(nextindex == this.seglist.length)
                  {
                     nextindex = 0;
                  }
                  this.seglist[nextindex].p1 = this.seglist[i].p1;
                  this.seglist.splice(i,1);
                  i--;
               }
               else
               {
                  newseglist.push(new Segment(this.seglist[i].p1,this.seglist[i].p2));
               }
            }
         }
         return newseglist;
      }
      
      public function invertY() : void
      {
         var len:int = int(this.seglist.length);
         if(len == 0)
         {
            return;
         }
         var processed:Array = new Array();
         for(var i:int = 0; i < len; i++)
         {
            if(processed.indexOf(this.seglist[i].p1) == -1)
            {
               this.seglist[i].p1.y = -this.seglist[i].p1.y;
               processed.push(this.seglist[i].p1);
            }
            if(processed.indexOf(this.seglist[i].p2) == -1)
            {
               this.seglist[i].p2.y = -this.seglist[i].p2.y;
               processed.push(this.seglist[i].p2);
            }
            if(this.seglist[i] is CubicBezierSegment)
            {
               this.seglist[i].c1.y = -this.seglist[i].c1.y;
               this.seglist[i].c2.y = -this.seglist[i].c2.y;
            }
            else if(this.seglist[i] is QuadBezierSegment)
            {
               this.seglist[i].c1.y = -this.seglist[i].c1.y;
            }
            else if(this.seglist[i] is ArcSegment)
            {
               this.seglist[i].sf = !this.seglist[i].sf;
               this.seglist[i].angle = -this.seglist[i].angle;
            }
         }
      }
      
      public function reversePath() : void
      {
         for(var i:int = 0; i < this.seglist.length; i++)
         {
            this.seglist[i] = this.seglist[i].reverse();
         }
         this.seglist.reverse();
      }
      
      public function separate() : Array
      {
         var path:Path = null;
         var paths:Array = new Array(new Path());
         var current:Segment = this.seglist[0];
         paths[paths.length - 1].addSegment(this.seglist[0]);
         for(var i:int = 1; i < this.seglist.length; i++)
         {
            if(!(this.seglist[i].p1 == current.p1 || this.seglist[i].p2 == current.p2 || this.seglist[i].p1 == current.p2 || this.seglist[i].p2 == current.p1))
            {
               paths.push(new Path());
            }
            paths[paths.length - 1].addSegment(this.seglist[i]);
            current = this.seglist[i];
         }
         for each(path in paths)
         {
            path.docx = this.docx;
            path.docy = this.docy;
         }
         return paths;
      }
      
      public function cleanup(tol:Number, close:Boolean = true) : void
      {
         var mid:Point = null;
         if(this.seglist.length < 2)
         {
            return;
         }
         for(var i:* = 0; i < this.seglist.length; i++)
         {
            if(this.seglist[i] is CubicBezierSegment)
            {
               if(Boolean(this.seglist[i].isflat(this.seglist[i],Global.tolerance) || Global.withinTolerance(this.seglist[i].p1,this.seglist[i].c2)) || Boolean(Global.withinTolerance(this.seglist[i].p2,this.seglist[i].c1)) || Global.withinTolerance(this.seglist[i].p1,this.seglist[i].c1) && Global.withinTolerance(this.seglist[i].p2,this.seglist[i].c2))
               {
                  this.seglist[i] = new Segment(this.seglist[i].p1,this.seglist[i].p2);
               }
               else if(Global.withinTolerance(this.seglist[i].p1,this.seglist[i].c1))
               {
                  this.seglist[i] = new QuadBezierSegment(this.seglist[i].p1,this.seglist[i].p2,this.seglist[i].c2);
               }
               else if(Global.withinTolerance(this.seglist[i].p2,this.seglist[i].c2))
               {
                  this.seglist[i] = new QuadBezierSegment(this.seglist[i].p1,this.seglist[i].p2,this.seglist[i].c1);
               }
            }
            else if(this.seglist[i] is QuadBezierSegment)
            {
               if(Boolean(this.seglist[i].isflat(this.seglist[i],Global.tolerance)) || Boolean(Global.withinTolerance(this.seglist[i].p1,this.seglist[i].c1)) || Global.withinTolerance(this.seglist[i].p2,this.seglist[i].c1))
               {
                  this.seglist[i] = new Segment(this.seglist[i].p1,this.seglist[i].p2);
               }
            }
         }
         for(i = 0; i < this.seglist.length; i++)
         {
            if(this.seglist[i] is CircularArc && Global.withinTolerance(this.seglist[i].p1,this.seglist[i].p2,tol) || !(this.seglist[i] is CircularArc) && this.seglist[i] is ArcSegment && this.seglist[i].lf == false && Global.withinTolerance(this.seglist[i].p1,this.seglist[i].p2,tol) || !(this.seglist[i] is ArcSegment) && Global.withinTolerance(this.seglist[i].p1,this.seglist[i].p2,tol))
            {
               if(!(!this.seglist[i].p1 || !this.seglist[i].p2))
               {
                  if(close)
                  {
                     if(Boolean(i == 0) && Boolean(this.seglist[i + 1].p1) && Boolean(this.seglist[this.seglist.length - 1].p2) && (this.seglist[i].p1 == this.seglist[this.seglist.length - 1].p2 || Global.withinTolerance(this.seglist[i].p1,this.seglist[this.seglist.length - 1].p2,tol)))
                     {
                        mid = Point.interpolate(this.seglist[this.seglist.length - 1].p2,this.seglist[i + 1].p1,0.5);
                        this.seglist[this.seglist.length - 1].p2 = mid;
                        this.seglist[i + 1].p1 = mid;
                        if(this.seglist[this.seglist.length - 1] is CircularArc)
                        {
                           this.seglist[this.seglist.length - 1].recalculateCenter();
                        }
                        if(this.seglist[i + 1] is CircularArc)
                        {
                           this.seglist[i + 1].recalculateCenter();
                        }
                     }
                     else if(Boolean(i == this.seglist.length - 1) && Boolean(this.seglist[0].p1) && Boolean(this.seglist[i - 1].p2) && (this.seglist[i].p2 == this.seglist[0].p1 || Global.withinTolerance(this.seglist[i].p2,this.seglist[0].p1,tol)))
                     {
                        mid = Point.interpolate(this.seglist[i - 1].p2,this.seglist[0].p1,0.5);
                        this.seglist[i - 1].p2 = mid;
                        this.seglist[0].p1 = mid;
                        if(this.seglist[i - 1] is CircularArc)
                        {
                           this.seglist[i - 1].recalculateCenter();
                        }
                        if(this.seglist[0] is CircularArc)
                        {
                           this.seglist[0].recalculateCenter();
                        }
                     }
                     else if(Boolean(i > 0 && i < this.seglist.length - 1) && Boolean(this.seglist[i + 1].p1) && Boolean(this.seglist[i - 1].p2))
                     {
                        mid = Point.interpolate(this.seglist[i - 1].p2,this.seglist[i + 1].p1,0.5);
                        this.seglist[i - 1].p2 = mid;
                        this.seglist[i + 1].p1 = mid;
                        if(this.seglist[i - 1] is CircularArc)
                        {
                           this.seglist[i - 1].recalculateCenter();
                        }
                        if(this.seglist[i + 1] is CircularArc)
                        {
                           this.seglist[i + 1].recalculateCenter();
                        }
                     }
                  }
                  this.seglist.splice(i,1);
                  if(this.seglist.length < 2)
                  {
                     return;
                  }
                  i--;
               }
            }
         }
      }
      
      public function makeContinuous() : void
      {
         var j:int = 0;
         if(this.seglist.length < 2)
         {
            return;
         }
         var newseglist:Array = new Array(this.seglist.shift());
         for(var i:int = 0; i < newseglist.length; i++)
         {
            for(j = 0; j < this.seglist.length; j++)
            {
               if(this.seglist[j].p1 == newseglist[i].p2)
               {
                  newseglist.push(this.seglist[j]);
                  this.seglist.splice(j,1);
                  break;
               }
               if(this.seglist[j].p2 == newseglist[i].p2)
               {
                  this.seglist[j] = this.seglist[j].reverse();
                  newseglist.push(this.seglist[j]);
                  this.seglist.splice(j,1);
                  break;
               }
            }
         }
         this.seglist = newseglist;
      }
   }
}

