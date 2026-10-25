package com.partkart
{
   import flash.display.*;
   import flash.events.*;
   import flash.geom.Matrix;
   import flash.geom.Point;
   import flash.geom.Rectangle;
   
   public class CutPath extends Path
   {
      
      public var parentpath:Path;
      
      public var originalpath:Array = new Array();
      
      protected var fillmap:BitmapData;
      
      protected var trans:Matrix;
      
      protected var region:Rectangle;
      
      protected var fillbitmap:Bitmap;
      
      public var pocketdepth:int;
      
      public var tabs:Array;
      
      public var tabpositions:Array;
      
      public var dragtab:Tab;
      
      public function CutPath()
      {
         super();
      }
      
      override protected function attachActions() : void
      {
      }
      
      override public function addSegment(seg:Segment) : void
      {
         var seg1:CircularArc = null;
         if(seg is CircularArc)
         {
            seg1 = seg as CircularArc;
            this.originalpath.push(seg1.arcclone());
         }
         else
         {
            this.originalpath.push(seg.clone());
         }
         super.addSegment(seg);
      }
      
      public function addSegments(list:Array) : void
      {
         var seg:Segment = null;
         if(seglist == null)
         {
            seglist = list;
         }
         else
         {
            seglist = seglist.concat(list);
         }
         for each(seg in list)
         {
            addChild(seg);
         }
      }
      
      override protected function renderLine(seg:Segment, sprite:Sprite = null) : void
      {
         if(active == true)
         {
            setLineStyle(4);
         }
         else
         {
            setLineStyle(3);
         }
         super.renderLine(seg,sprite);
      }
      
      override protected function renderArc(seg:ArcSegment, sprite:Sprite = null) : void
      {
         if(active == true)
         {
            setLineStyle(6);
         }
         else
         {
            setLineStyle(5);
         }
         super.renderArc(seg,sprite);
      }
      
      public function redrawCuts(diameter:Number) : void
      {
         graphics.clear();
         renderClear();
         graphics.lineStyle(diameter * Global.zoom,16711680,0.2,false,LineScaleMode.NORMAL,CapsStyle.ROUND);
         graphics.moveTo(seglist[0].p1.x * Global.zoom,-seglist[0].p1.y * Global.zoom);
         for(var i:int = 0; i < seglist.length; i++)
         {
            if(seglist[i] is CircularArc)
            {
               this.renderFillArc(seglist[i],Global.zoom,3,true);
            }
            else
            {
               this.renderFillLine(seglist[i],Global.zoom,true);
            }
         }
      }
      
      public function redrawStartCut(prev:Point) : void
      {
         this.renderFillLine(new Segment(prev,seglist[0].p1),Global.zoom,false);
      }
      
      protected function renderFill(radius:Number, cutlist:Array) : Number
      {
         var cutpath:CutPath = null;
         var factor:Number = NaN;
         var linethickness:Number = NaN;
         var spritewidth:Number = NaN;
         var spriteheight:Number = NaN;
         var scale:Number = NaN;
         var idealwidth:Number = NaN;
         var idealheight:Number = NaN;
         var seg:Segment = null;
         var i:int = 0;
         for each(cutpath in cutlist)
         {
            addChild(cutpath);
            for each(seg in cutpath.seglist)
            {
               cutpath.addChild(seg);
            }
            cutpath.redraw();
         }
         this.region = this.getBounds(this);
         factor = 255 / (Math.abs(2 * radius) - Global.bitmaptolerance);
         linethickness = 255;
         spritewidth = (this.region.width / Global.zoom + 2 * Math.abs(radius)) * factor;
         spriteheight = (this.region.height / Global.zoom + 2 * Math.abs(radius)) * factor;
         factor += 0.5 * Global.bitmaptolerance * Math.max(spritewidth,spriteheight);
         if(spritewidth > Global.bitmapsize)
         {
            factor *= Global.bitmapsize / spritewidth;
            linethickness *= Global.bitmapsize / spritewidth;
            spriteheight *= Global.bitmapsize / spritewidth;
            spritewidth = Global.bitmapsize;
         }
         if(spriteheight > Global.bitmapsize)
         {
            factor *= Global.bitmapsize / spriteheight;
            linethickness *= Global.bitmapsize / spriteheight;
            spritewidth *= Global.bitmapsize / spriteheight;
            spriteheight = Global.bitmapsize;
         }
         factor *= Math.floor(linethickness) / linethickness;
         linethickness = Math.floor(linethickness);
         graphics.lineStyle(linethickness,0,1,false,LineScaleMode.NORMAL,CapsStyle.ROUND);
         while(numChildren > 0)
         {
            removeChildAt(0);
         }
         for each(cutpath in cutlist)
         {
            for(i = 0; i < cutpath.seglist.length; i++)
            {
               if(cutpath.seglist[i] is CircularArc)
               {
                  this.renderFillArc(cutpath.seglist[i],factor);
               }
               else
               {
                  this.renderFillLine(cutpath.seglist[i],factor);
               }
            }
         }
         this.region = this.getBounds(this);
         idealwidth = this.region.width;
         idealheight = this.region.height;
         if(idealwidth > Global.bitmapsize)
         {
            idealheight *= Global.bitmapsize / idealwidth;
            idealwidth = Global.bitmapsize;
         }
         if(idealheight > Global.bitmapsize)
         {
            idealwidth *= Global.bitmapsize / idealheight;
            idealheight = Global.bitmapsize;
         }
         scale = idealwidth / this.region.width;
         this.trans = new Matrix(scale,0,0,scale,-this.region.x * scale,-this.region.y * scale);
         this.fillmap = new BitmapData(this.region.width * scale,this.region.height * scale,true,0);
         this.fillmap.draw(this,this.trans);
         graphics.clear();
         return factor;
      }
      
      public function renderFillLine(segment:Segment, factor:Number, continuous:Boolean = false, sprite:Sprite = null) : void
      {
         if(sprite == null)
         {
            sprite = this;
         }
         if(continuous == false)
         {
            sprite.graphics.moveTo(segment.p1.x * factor,-segment.p1.y * factor);
         }
         sprite.graphics.lineTo(segment.p2.x * factor,-segment.p2.y * factor);
      }
      
      public function renderFillArc(arc:CircularArc, factor:Number, tol:Number = 0, continuous:Boolean = false, sprite:Sprite = null) : void
      {
         var theta:Number = NaN;
         var x1:Number = NaN;
         var y1:Number = NaN;
         var tp1:Point = null;
         var tp2:Point = null;
         var sinangle:Number = NaN;
         var cosangle:Number = NaN;
         var i:int = 0;
         var skiplast:Boolean = true;
         if(tol == 0)
         {
            theta = 0.25 * Math.sqrt(Global.tolerance / Math.abs(arc.radius * 2));
         }
         else
         {
            theta = tol * Math.sqrt(Global.tolerance / Math.abs(arc.radius * 2));
            skiplast = false;
         }
         var angle:Number = Math.atan2(arc.p1.y - arc.center.y,arc.p1.x - arc.center.x);
         var totalangle:Number = Global.getAngle(new Point(arc.p1.x - arc.center.x,arc.p1.y - arc.center.y),new Point(arc.p2.x - arc.center.x,arc.p2.y - arc.center.y));
         var segs:* = int(Math.ceil(Math.abs(totalangle / theta)));
         theta = totalangle / segs;
         if(segs > 0)
         {
            tp1 = arc.p1;
            if(skiplast == true && segs > 1)
            {
               segs--;
            }
            for(i = 0; i < segs; i++)
            {
               angle += theta;
               sinangle = Math.sin(angle);
               cosangle = Math.cos(angle);
               x1 = arc.center.x + Math.abs(arc.radius) * cosangle;
               y1 = arc.center.y + Math.abs(arc.radius) * sinangle;
               tp2 = new Point(x1,y1);
               this.renderFillLine(new Segment(tp1,tp2),factor,continuous,sprite);
               tp1 = tp2;
            }
         }
      }
      
      public function setDirection(dir:int) : void
      {
         makeContinuous();
         if(dir != this.getDirection())
         {
            reversePath();
         }
      }
      
      public function getDirection() : int
      {
         var area:Number = this.getPolygonArea();
         if(area < 0)
         {
            return 1;
         }
         if(area > 0)
         {
            return 2;
         }
         return 0;
      }
      
      public function getPolygonArea(arealist:Array = null) : Number
      {
         var seg:* = undefined;
         var width:Number = NaN;
         var area:Number = 0;
         if(arealist == null)
         {
            arealist = seglist;
         }
         for each(seg in arealist)
         {
            width = seg.p2.x - seg.p1.x;
            area += width * seg.p2.y;
            area += 0.5 * width * (seg.p1.y - seg.p2.y);
         }
         return area;
      }
      
      public function offset(cutlist:Array, radius:Number, clean:Boolean = false) : Array
      {
         var cutpath:CutPath = null;
         var factor:Number = NaN;
         var chains:Array = null;
         var area:Number = NaN;
         var minarea:Number = Math.PI * Math.pow(radius,2);
         for(var i:* = 0; i < cutlist.length; i++)
         {
            cutpath = cutlist[i];
            area = this.getPolygonArea(cutpath.seglist);
            if(Boolean(this.pocketdepth) && Boolean(this.pocketdepth > 0) && Math.abs(area) < minarea)
            {
               cutlist.splice(i,1);
               i--;
            }
         }
         if(cutlist.length == 0)
         {
            return new Array();
         }
         if(clean == false)
         {
            for each(cutpath in cutlist)
            {
               cutpath.intersect(radius,true);
            }
         }
         for each(cutpath in cutlist)
         {
            cutpath.originalpath = cutpath.seglist;
         }
         for each(cutpath in cutlist)
         {
            cutpath.clonePath();
         }
         factor = this.renderFill(radius,cutlist);
         for each(cutpath in cutlist)
         {
            cutpath.simpleoffset(radius);
         }
         for each(cutpath in cutlist)
         {
            cutpath.joinSequence();
         }
         for each(cutpath in cutlist)
         {
            cutpath.addCircles(radius);
         }
         for each(cutpath in cutlist)
         {
            cutpath.cleanup(0.5);
         }
         chains = new Array();
         for each(cutpath in cutlist)
         {
            chains = chains.concat(cutpath.getMonotoneChains());
            if(contains(cutpath))
            {
               removeChild(cutpath);
            }
         }
         this.intersect(radius,false,chains);
         this.removeInvalid(factor);
         return this.processLoops();
      }
      
      public function clonePath() : void
      {
         var seg:* = undefined;
         var newseglist:Array = new Array();
         for each(seg in seglist)
         {
            if(seg is CircularArc)
            {
               newseglist.push(seg.arcclone());
            }
            else
            {
               newseglist.push(seg.clone());
            }
         }
         while(numChildren > 0)
         {
            removeChildAt(0);
         }
         for each(seg in newseglist)
         {
            addChild(seg);
         }
         seglist = newseglist;
      }
      
      protected function simpleoffset(radius:Number) : void
      {
         for(var i:int = 0; i < seglist.length; i++)
         {
            seglist[i].offset(radius);
            seglist[i].name = i;
         }
      }
      
      public function joinSequence(tol:Number = 0.5) : void
      {
         for(var i:int = 0; i < seglist.length - 1; i++)
         {
            if(seglist[i].p2 != seglist[i + 1].p1 && Global.withinTolerance(seglist[i].p2,seglist[i + 1].p1,tol))
            {
               seglist[i].p2 = seglist[i + 1].p1;
            }
            else if(seglist[i].p2 != seglist[i + 1].p1)
            {
               this.splitSegments(i,i + 1);
            }
         }
         if(seglist[seglist.length - 1].p2 != seglist[0].p1 && Global.withinTolerance(seglist[seglist.length - 1].p2,seglist[0].p1,tol))
         {
            seglist[seglist.length - 1].p2 = seglist[0].p1;
         }
         else
         {
            this.splitSegments(seglist.length - 1,0);
         }
      }
      
      protected function splitSegments(index1:int, index2:int) : void
      {
         var ip:Array = null;
         var p:Point = null;
         var segname:String = null;
         var newarc:CircularArc = null;
         var newsegment:Segment = null;
         var newarc2:CircularArc = null;
         var newsegment2:Segment = null;
         if(index1 < 0 || index2 < 0)
         {
            return;
         }
         var seg1:* = seglist[index1];
         var seg2:* = seglist[index2];
         if(seg1 is CircularArc && seg2 is CircularArc)
         {
            ip = this.arcArcIntersect(seg1,seg2);
         }
         else if(!(seg1 is CircularArc) && seg2 is CircularArc)
         {
            ip = this.lineArcIntersect(seg1,seg2);
         }
         else if(seg1 is CircularArc && !(seg2 is CircularArc))
         {
            ip = this.lineArcIntersect(seg2,seg1);
         }
         else
         {
            p = Global.lineIntersect(seg2.p1,seg2.p2,seg1.p1,seg1.p2,true);
         }
         if(ip != null)
         {
            p = ip[0];
         }
         if(p != null)
         {
            segname = seglist[index1].name;
            if(seg1 is CircularArc)
            {
               newarc = new CircularArc(seg1.p1,p,seg1.center,seg1.radius);
               seglist[index1] = newarc;
            }
            else
            {
               newsegment = new Segment(seg1.p1,p);
               seglist[index1] = newsegment;
            }
            seglist[index1].name = segname;
            segname = seglist[index2].name;
            if(seg2 is CircularArc)
            {
               newarc2 = new CircularArc(p,seg2.p2,seg2.center,seg2.radius);
               seglist[index2] = newarc2;
            }
            else
            {
               newsegment2 = new Segment(p,seg2.p2);
               seglist[index2] = newsegment2;
            }
            seglist[index2].name = segname;
         }
      }
      
      protected function addCircles(radius:Number) : void
      {
         var circle:CircularArc = null;
         for(var i:int = 0; i < seglist.length - 1; i++)
         {
            circle = this.getCircle(seglist[i],seglist[i + 1],radius);
            if(circle != null)
            {
               seglist.splice(i + 1,0,circle);
               i++;
            }
         }
         circle = this.getCircle(seglist[seglist.length - 1],seglist[0],radius);
         if(circle != null)
         {
            seglist.push(circle);
         }
      }
      
      protected function getCircle(offset1:Segment, offset2:Segment, radius:Number) : CircularArc
      {
         var off1:* = undefined;
         var off2:* = undefined;
         var norm1:Point = null;
         var norm2:Point = null;
         if(offset1.p2 == offset2.p1)
         {
            return null;
         }
         if(offset1 is CircularArc)
         {
            off1 = offset1 as CircularArc;
         }
         else
         {
            off1 = offset1;
         }
         if(offset2 is CircularArc)
         {
            off2 = offset2 as CircularArc;
         }
         else
         {
            off2 = offset2;
         }
         return new CircularArc(off1.p2,off2.p1,this.originalpath[off1.name].p2.clone(),radius);
      }
      
      protected function getMonotoneChains() : Array
      {
         var point:Point = null;
         var pdir:Boolean = false;
         var cdir:Boolean = false;
         var odir:Boolean = false;
         var chain:* = undefined;
         var circle:CircularArc = null;
         var arc1:CircularArc = null;
         var arc2:CircularArc = null;
         var firstchain:MonotoneChain = null;
         var monochain:MonotoneChain = null;
         var newchain:Array = null;
         var seg:* = undefined;
         var n:String = null;
         for(var i:int = 0; i < seglist.length; i++)
         {
            if(seglist[i] is CircularArc)
            {
               circle = seglist[i] as CircularArc;
               if((circle.p1.y > circle.center.y && circle.p2.y < circle.center.y || circle.p1.y < circle.center.y && circle.p2.y > circle.center.y) && Math.abs(circle.p1.y - circle.center.y) > 1e-10 && Math.abs(circle.p2.y - circle.center.y) > 1e-10)
               {
                  point = new Point(circle.center.x + Math.abs(circle.radius),circle.center.y);
                  if(!circle.onArc(point))
                  {
                     point = new Point(circle.center.x - Math.abs(circle.radius),circle.center.y);
                  }
                  arc1 = new CircularArc(circle.p1,point,circle.center,circle.radius);
                  arc2 = new CircularArc(point,circle.p2,circle.center,circle.radius);
                  seglist.splice(i,1,arc1,arc2);
                  i++;
               }
            }
         }
         var chains:Array = new Array(new MonotoneChain());
         if(seglist[0].p1.x > seglist[0].p2.x)
         {
            pdir = false;
         }
         else
         {
            pdir = true;
         }
         odir = pdir;
         var len:int = int(seglist.length);
         for(i = 0; i < len; i++)
         {
            if(seglist[i].p1.x > seglist[i].p2.x)
            {
               cdir = false;
            }
            else
            {
               cdir = true;
            }
            if(cdir != pdir)
            {
               pdir = cdir;
               chains.push(new MonotoneChain());
               chains[chains.length - 1].push(seglist[i]);
            }
            else
            {
               chains[chains.length - 1].push(seglist[i]);
            }
            seglist[i].name = i;
         }
         if(cdir == odir && chains.length > 1)
         {
            firstchain = chains.shift();
            monochain = new MonotoneChain();
            newchain = chains[chains.length - 1].concat(firstchain);
            for each(seg in newchain)
            {
               monochain.push(seg);
            }
            chains[chains.length - 1] = monochain;
         }
         for each(chain in chains)
         {
            if(chain[0].p1.x > chain[chain.length - 1].p2.x)
            {
               for(i = 0; i < chain.length; i++)
               {
                  n = chain[i].name;
                  chain[i] = chain[i].reverse();
                  chain[i].name = n;
               }
               chain.reverse();
               chain.reversed = true;
            }
         }
         return chains;
      }
      
      protected function intersect(radius:Number, trim:Boolean = false, chains:Array = null) : void
      {
         var chain:MonotoneChain = null;
         var i:* = 0;
         var ip:Array = null;
         var seg1:* = undefined;
         var seg2:* = undefined;
         var trim1:Boolean = false;
         var trim2:Boolean = false;
         var m:Number = NaN;
         var newarc1:CircularArc = null;
         var newarc2:CircularArc = null;
         var newarc3:CircularArc = null;
         var newsegment1:Segment = null;
         var newsegment2:Segment = null;
         var newsegment3:Segment = null;
         var intersections:Array = null;
         var previntersect:Boolean = false;
         var frontchain:MonotoneChain = null;
         var schain:MonotoneChain = null;
         var p:Point = null;
         var skip1:Boolean = false;
         var skip2:Boolean = false;
         var s1a:Boolean = false;
         var s1b:Boolean = false;
         var s2a:Boolean = false;
         var s2b:Boolean = false;
         var n:String = null;
         var odd:Boolean = false;
         var interval:Boolean = false;
         var seg:Segment = null;
         if(chains == null)
         {
            chains = this.getMonotoneChains();
         }
         var activechains:Array = new Array();
         var sweepchains:Array = new Array();
         for each(chain in chains)
         {
            chain.frontvalue = chain[0].p1.x;
            activechains.push(chain);
         }
         activechains.sortOn("frontvalue",Array.NUMERIC);
         intersections = new Array();
         previntersect = false;
         frontchain = activechains[0];
         while(activechains.length > 0)
         {
            frontchain = activechains[0];
            if(frontchain.frontindex < frontchain.length)
            {
               ++frontchain.frontindex;
               if(frontchain.frontindex == frontchain.length)
               {
                  frontchain.frontvalue = frontchain[frontchain.frontindex - 1].p2.x;
               }
               else
               {
                  frontchain.frontvalue = frontchain[frontchain.frontindex].p1.x;
               }
               if(frontchain.frontindex == 1)
               {
                  sweepchains.push(frontchain);
               }
               seg1 = frontchain[frontchain.frontindex - 1];
               previntersect = false;
               for each(schain in sweepchains)
               {
                  if(schain.frontindex - 1 < schain.length)
                  {
                     seg2 = schain[schain.frontindex - 1];
                     if(seg2 != null)
                     {
                        ip = null;
                        p = null;
                        if(schain != frontchain)
                        {
                           if(seg1 is CircularArc && seg2 is CircularArc)
                           {
                              ip = this.arcArcIntersect(seg1,seg2);
                           }
                           else if(!(seg1 is CircularArc) && seg2 is CircularArc)
                           {
                              ip = this.lineArcIntersect(seg1,seg2);
                           }
                           else if(seg1 is CircularArc && !(seg2 is CircularArc))
                           {
                              ip = this.lineArcIntersect(seg2,seg1);
                           }
                           else
                           {
                              p = Global.lineIntersect(seg2.p1,seg2.p2,seg1.p1,seg1.p2,true);
                           }
                           if(ip != null && ip.length == 1)
                           {
                              p = ip[0];
                           }
                           else if(ip != null && ip.length == 2)
                           {
                              intersections.push(ip[0]);
                              intersections.push(ip[1]);
                           }
                           skip1 = false;
                           skip2 = false;
                           s1a = false;
                           s1b = false;
                           s2a = false;
                           s2b = false;
                           if(p != null && (seg1.p1 == seg2.p1 || seg1.p1 == seg2.p2 || seg1.p2 == seg2.p2 || seg1.p2 == seg2.p1))
                           {
                              if(Global.withinTolerance(seg1.p1,p,0.1))
                              {
                                 skip1 = true;
                                 s1a = true;
                                 p = seg1.p1;
                              }
                              else if(Global.withinTolerance(seg1.p2,p,0.1))
                              {
                                 skip1 = true;
                                 s1b = true;
                                 p = seg1.p2;
                              }
                              if(Global.withinTolerance(seg2.p1,p,0.1))
                              {
                                 skip2 = true;
                                 s2a = true;
                                 p = seg2.p1;
                              }
                              else if(Global.withinTolerance(seg2.p2,p,0.1))
                              {
                                 skip2 = true;
                                 s2b = true;
                                 p = seg2.p2;
                              }
                              if(skip1 && skip2)
                              {
                                 if(s1a && s2a)
                                 {
                                    seg1.p1 = p;
                                    seg2.p1 = p;
                                 }
                                 else if(s1a && s2b)
                                 {
                                    seg1.p1 = p;
                                    seg2.p2 = p;
                                 }
                                 else if(s1b && s2a)
                                 {
                                    seg1.p2 = p;
                                    seg2.p1 = p;
                                 }
                                 else if(s1b && s2b)
                                 {
                                    seg1.p2 = p;
                                    seg2.p2 = p;
                                 }
                              }
                           }
                           else if(ip != null && ip.length == 2 && (seg1.p1 == seg2.p1 || seg1.p1 == seg2.p2 || seg1.p2 == seg2.p2 || seg1.p2 == seg2.p1))
                           {
                              if(Global.withinTolerance(seg1.p1,ip[0],0.1) || Global.withinTolerance(seg1.p2,ip[0],0.1) || Global.withinTolerance(seg2.p1,ip[0],0.1) || Global.withinTolerance(seg2.p2,ip[0],0.1))
                              {
                                 ip[0] = null;
                              }
                              if(Global.withinTolerance(seg1.p1,ip[1],0.1) || Global.withinTolerance(seg1.p2,ip[1],0.1) || Global.withinTolerance(seg2.p1,ip[1],0.1) || Global.withinTolerance(seg2.p2,ip[1],0.1))
                              {
                                 ip[1] = null;
                              }
                              if(ip[0] != null && ip[1] == null)
                              {
                                 p = ip[0];
                              }
                              else if(ip[1] != null && ip[0] == null)
                              {
                                 p = ip[1];
                              }
                              else if(ip[0] == null && ip[1] == null)
                              {
                                 p = null;
                              }
                           }
                           if(p != null)
                           {
                              if(!skip1 || !skip2)
                              {
                                 intersections.push(p);
                                 previntersect = true;
                              }
                              if(skip1 == false)
                              {
                                 if(seg1 is CircularArc)
                                 {
                                    newarc1 = new CircularArc(seg1.p1,p,seg1.center,seg1.radius);
                                    newarc2 = new CircularArc(p,seg1.p2,seg1.center,seg1.radius);
                                    frontchain.splice(frontchain.frontindex - 1,1,newarc1,newarc2);
                                    seg1 = newarc1;
                                 }
                                 else
                                 {
                                    newsegment1 = new Segment(seg1.p1,p);
                                    newsegment2 = new Segment(p,seg1.p2);
                                    frontchain.splice(frontchain.frontindex - 1,1,newsegment1,newsegment2);
                                    seg1 = newsegment1;
                                 }
                                 frontchain.frontvalue = p.x;
                              }
                              if(skip2 == false)
                              {
                                 if(seg2 is CircularArc)
                                 {
                                    newarc1 = new CircularArc(seg2.p1,p,seg2.center,seg2.radius);
                                    newarc2 = new CircularArc(p,seg2.p2,seg2.center,seg2.radius);
                                    schain.splice(schain.frontindex - 1,1,newarc1,newarc2);
                                 }
                                 else
                                 {
                                    newsegment1 = new Segment(seg2.p1,p);
                                    newsegment2 = new Segment(p,seg2.p2);
                                    schain.splice(schain.frontindex - 1,1,newsegment1,newsegment2);
                                 }
                                 schain.frontvalue = p.x;
                              }
                           }
                           else if(ip != null && ip.length == 2 && ip[0] != null && ip[1] != null)
                           {
                              intersections = intersections.concat(ip);
                              previntersect = true;
                              if(seg1 is CircularArc)
                              {
                                 newarc1 = new CircularArc(seg1.p1,ip[0],seg1.center,seg1.radius);
                                 newarc2 = new CircularArc(ip[0],ip[1],seg1.center,seg1.radius);
                                 newarc3 = new CircularArc(ip[1],seg1.p2,seg1.center,seg1.radius);
                                 frontchain.splice(frontchain.frontindex - 1,1,newarc1,newarc2,newarc3);
                                 seg1 = newarc1;
                              }
                              else
                              {
                                 newsegment1 = new Segment(seg1.p1,ip[0]);
                                 newsegment2 = new Segment(ip[0],ip[1]);
                                 newsegment3 = new Segment(ip[1],seg1.p2);
                                 frontchain.splice(frontchain.frontindex - 1,1,newsegment1,newsegment2,newsegment3);
                                 seg1 = newsegment1;
                              }
                              frontchain.frontvalue = ip[0].x;
                              if(seg2 is CircularArc)
                              {
                                 newarc1 = new CircularArc(seg2.p1,ip[0],seg2.center,seg2.radius);
                                 newarc2 = new CircularArc(ip[0],ip[1],seg2.center,seg2.radius);
                                 newarc3 = new CircularArc(ip[1],seg2.p2,seg2.center,seg2.radius);
                                 schain.splice(schain.frontindex - 1,1,newarc1,newarc2,newarc3);
                              }
                              else
                              {
                                 newsegment1 = new Segment(seg2.p1,ip[0]);
                                 newsegment2 = new Segment(ip[0],ip[1]);
                                 newsegment3 = new Segment(ip[1],seg2.p2);
                                 schain.splice(schain.frontindex - 1,1,newsegment1,newsegment2,newsegment3);
                              }
                              schain.frontvalue = ip[0].x;
                           }
                        }
                     }
                  }
                  else
                  {
                     sweepchains.splice(sweepchains.indexOf(schain),1);
                  }
               }
               activechains.sortOn("frontvalue",Array.NUMERIC);
            }
            else
            {
               activechains.shift();
               sweepchains.splice(sweepchains.indexOf(frontchain),1);
            }
         }
         var newseglist:Array = new Array();
         for each(chain in chains)
         {
            if(chain.reversed == true)
            {
               for(i = 0; i < chain.length; i++)
               {
                  n = chain[i].name;
                  chain[i] = chain[i].reverse();
                  chain[i].name = n;
               }
               chain.reverse();
               chain.reversed = false;
            }
            newseglist = newseglist.concat(chain);
         }
         seglist = newseglist;
         if(trim == true)
         {
            odd = true;
            interval = true;
            for(i = 0; i < seglist.length; i++)
            {
               seg = seglist[i];
               if(intersections.indexOf(seg.p1) != -1)
               {
                  interval = !interval;
               }
               if(odd != interval)
               {
                  seglist.splice(i,1);
                  i--;
               }
            }
         }
      }
      
      protected function reposition(activechains:Array) : void
      {
         var frontchain:MonotoneChain = activechains.shift();
         for(var i:int = 0; i < activechains.length; i++)
         {
            if(frontchain.frontvalue > activechains[i].frontvalue)
            {
               activechains.splice(i + 1,0,frontchain);
               return;
            }
         }
         activechains.splice(0,0,frontchain);
      }
      
      protected function removeInvalid(factor:Number) : *
      {
         var p1:Point = null;
         var p2:Point = null;
         var p3:Point = null;
         var dot:Dot = null;
         var len:int = int(seglist.length);
         var origin:Point = new Point(0,0);
         for(var i:* = 0; i < len; i++)
         {
            p1 = new Point(seglist[i].p1.x * factor,-seglist[i].p1.y * factor);
            p2 = new Point(seglist[i].p2.x * factor,-seglist[i].p2.y * factor);
            p1 = this.trans.transformPoint(p1);
            p2 = this.trans.transformPoint(p2);
            this.fillmap.setPixel(p1.x,p1.y,16711680);
            if(this.fillmap.hitTest(origin,170,p1) || this.fillmap.hitTest(origin,170,p2))
            {
               seglist[i].name = "invalid";
            }
            else
            {
               p3 = this.getMid(seglist[i]);
               p3.y = -p3.y;
               p3.x *= factor;
               p3.y *= factor;
               p3 = this.trans.transformPoint(p3);
               if(this.fillmap.hitTest(origin,170,p3))
               {
                  seglist[i].name = "invalid";
               }
            }
         }
         for(i = 0; i < seglist.length; i++)
         {
            if(seglist[i].name == "invalid")
            {
               seglist.splice(i,1);
               i--;
            }
         }
         this.fillmap.dispose();
         this.fillmap = null;
      }
      
      protected function getMid(segment:*) : Point
      {
         var mid:Point = null;
         var arc:CircularArc = null;
         var diff:Number = NaN;
         var angle:Number = NaN;
         var normx:Number = NaN;
         var normy:Number = NaN;
         var seg:Segment = null;
         if(segment is CircularArc)
         {
            arc = segment as CircularArc;
            diff = Global.getAngle(new Point(arc.p1.x - arc.center.x,arc.p1.y - arc.center.y),new Point(arc.p2.x - arc.center.x,arc.p2.y - arc.center.y));
            angle = Math.atan2(arc.p1.y - arc.center.y,arc.p1.x - arc.center.x);
            angle += 0.5 * diff;
            normx = Math.abs(arc.radius) * Math.cos(angle);
            normy = Math.abs(arc.radius) * Math.sin(angle);
            mid = new Point(arc.center.x + normx,arc.center.y + normy);
         }
         else
         {
            seg = segment as Segment;
            mid = new Point(0.5 * (seg.p1.x + seg.p2.x),0.5 * (seg.p1.y + seg.p2.y));
         }
         return mid;
      }
      
      protected function processLoops() : Array
      {
         var origin:Segment = null;
         var loop:Array = null;
         var seg:* = undefined;
         var l:* = undefined;
         var i:int = 0;
         var area:Number = NaN;
         var index:int = 0;
         var p:Point = null;
         var j:int = 0;
         var cutpath:CutPath = null;
         var newseglist:Array = seglist.slice();
         if(seglist.length < 2)
         {
            return new Array();
         }
         var processedloops:Array = new Array();
         var arealimit:Number = 0.000015;
         if(Global.unit == "cm")
         {
            arealimit *= 2.54 * 2.54;
         }
         var minarea:Number = 0;
         while(seglist.length > 0)
         {
            origin = this.getLongest();
            for each(seg in seglist)
            {
               seg.active = false;
            }
            loop = this.branchNext(origin,origin);
            if(loop.length > 1)
            {
               loop.pop();
               for each(l in loop)
               {
                  index = seglist.indexOf(l);
                  if(index != -1)
                  {
                     seglist.splice(index,1);
                  }
               }
               for(i = 0; i < loop.length; i++)
               {
                  p = loop[i].p2;
                  for(j = Math.max(0,i - 5); j < i; j++)
                  {
                     if(p == loop[j].p1 && j != 0 && i != loop.length)
                     {
                        loop.splice(j,i - j + 1);
                        i = j;
                        break;
                     }
                  }
               }
               if(!(loop.length < 2 || loop[0].p1 != loop[loop.length - 1].p2))
               {
                  area = this.getPolygonArea(loop);
                  if(area < minarea)
                  {
                     minarea = area;
                  }
                  if(Math.abs(area) > arealimit)
                  {
                     cutpath = new CutPath();
                     cutpath.addSegments(loop);
                     processedloops.push(cutpath);
                  }
               }
            }
            else
            {
               seglist.splice(seglist.indexOf(origin),1);
            }
         }
         if(minarea >= 0)
         {
            return new Array();
         }
         return processedloops;
      }
      
      protected function getLongest() : Segment
      {
         var dis:Number = NaN;
         var longest:Segment = seglist[0];
         var len:int = int(seglist.length);
         var maxdis:Number = Math.pow(seglist[0].p1.x - seglist[0].p2.x,2) + Math.pow(seglist[0].p1.y - seglist[0].p2.y,2);
         for(var i:int = 0; i < len; i++)
         {
            dis = Math.pow(seglist[i].p1.x - seglist[i].p2.x,2) + Math.pow(seglist[i].p1.y - seglist[i].p2.y,2);
            if(dis > maxdis)
            {
               maxdis = dis;
               longest = seglist[i];
            }
         }
         return longest;
      }
      
      protected function branchNext(current:Segment, origin:Segment) : Array
      {
         var index:int = 0;
         var n:* = undefined;
         var recursloop:Array = null;
         var loop:Array = new Array(current);
         var nextarray:Array = this.getNext(current);
         while(nextarray.length == 1)
         {
            loop.push(nextarray[0]);
            nextarray[0].active = true;
            if(nextarray[0] == origin)
            {
               return loop;
            }
            current = nextarray[0];
            nextarray = this.getNext(current);
         }
         for each(n in nextarray)
         {
            n.active = true;
            if(n == origin)
            {
               loop.push(origin);
               return loop;
            }
            recursloop = this.branchNext(n,origin);
            if(recursloop.length > 0)
            {
               if(recursloop[recursloop.length - 1] == origin)
               {
                  return loop.concat(recursloop);
               }
            }
         }
         return new Array();
      }
      
      protected function getNext(current:Segment) : Array
      {
         var seg:* = undefined;
         var nextarray:Array = new Array();
         for(var i:int = 0; i < seglist.length; i++)
         {
            seg = seglist[i];
            if(seg != current && seg.active == false)
            {
               if(seg.p1 == current.p2)
               {
                  nextarray.push(seg);
               }
            }
         }
         return nextarray;
      }
      
      protected function lineArcIntersect(seg:Segment, arc:CircularArc, segment:Boolean = true) : Array
      {
         var t1:Number = NaN;
         var t2:Number = NaN;
         var ip1:Point = null;
         var ip2:Point = null;
         var returnarray:Array = null;
         var A:Number = Math.pow(seg.p2.x - seg.p1.x,2) + Math.pow(seg.p2.y - seg.p1.y,2);
         var B:Number = 2 * (seg.p2.x - seg.p1.x) * (seg.p1.x - arc.center.x) + 2 * (seg.p2.y - seg.p1.y) * (seg.p1.y - arc.center.y);
         var C:Number = Math.pow(seg.p1.x - arc.center.x,2) + Math.pow(seg.p1.y - arc.center.y,2) - arc.radius * arc.radius;
         var discriminant:Number = Math.pow(B,2) - 4 * A * C;
         if(discriminant < 0)
         {
            return null;
         }
         discriminant = Math.sqrt(discriminant);
         t1 = 0.5 * (-B + discriminant) / A;
         t2 = 0.5 * (-B - discriminant) / A;
         if(segment && (t1 <= 0 || t1 >= 1) && (t2 <= 0 || t2 >= 1))
         {
            return null;
         }
         if(!segment || segment && t1 > 0 && t1 < 1)
         {
            ip1 = new Point();
            ip1.x = seg.p1.x + (seg.p2.x - seg.p1.x) * t1;
            ip1.y = seg.p1.y + (seg.p2.y - seg.p1.y) * t1;
         }
         if(!segment || segment && t2 > 0 && t2 < 1)
         {
            ip2 = new Point();
            ip2.x = seg.p1.x + (seg.p2.x - seg.p1.x) * t2;
            ip2.y = seg.p1.y + (seg.p2.y - seg.p1.y) * t2;
         }
         if(ip1 != null && !arc.onArc(ip1))
         {
            ip1 = null;
         }
         if(ip2 != null && !arc.onArc(ip2))
         {
            ip2 = null;
         }
         if(!ip1 && !ip2)
         {
            return null;
         }
         if(Boolean(ip1) && !ip2)
         {
            return new Array(ip1);
         }
         if(Boolean(ip2) && !ip1)
         {
            return new Array(ip2);
         }
         if(ip1.equals(ip2))
         {
            return new Array(ip1);
         }
         if(ip1.x < ip2.x)
         {
            returnarray = new Array(ip1,ip2);
         }
         else
         {
            returnarray = new Array(ip2,ip1);
         }
         return returnarray;
      }
      
      protected function arcArcIntersect(arc1:CircularArc, arc2:CircularArc) : Array
      {
         var returnarray:Array = null;
         var d2:Number = Math.pow(arc1.center.x - arc2.center.x,2) + Math.pow(arc1.center.y - arc2.center.y,2);
         var d:Number = Math.sqrt(d2);
         if(d > Math.abs(arc1.radius) + Math.abs(arc2.radius))
         {
            return null;
         }
         if(d < Math.abs(Math.abs(arc1.radius) - Math.abs(arc2.radius)))
         {
            return null;
         }
         var a:Number = (Math.pow(arc1.radius,2) - Math.pow(arc2.radius,2) + d2) / (2 * d);
         var h:Number = Math.sqrt(Math.pow(arc1.radius,2) - Math.pow(a,2));
         var mid:Point = new Point();
         mid.x = arc1.center.x + a * (arc2.center.x - arc1.center.x) / d;
         mid.y = arc1.center.y + a * (arc2.center.y - arc1.center.y) / d;
         var ip1:Point = new Point();
         var ip2:Point = new Point();
         ip1.x = mid.x + h * (arc2.center.y - arc1.center.y) / d;
         ip1.y = mid.y - h * (arc2.center.x - arc1.center.x) / d;
         ip2.x = mid.x - h * (arc2.center.y - arc1.center.y) / d;
         ip2.y = mid.y + h * (arc2.center.x - arc1.center.x) / d;
         if(isNaN(ip1.x) || isNaN(ip1.y))
         {
            ip1 = null;
         }
         if(isNaN(ip2.x) || isNaN(ip2.y))
         {
            ip2 = null;
         }
         if(ip1 != null && (!arc1.onArc(ip1) || !arc2.onArc(ip1)))
         {
            ip1 = null;
         }
         if(ip2 != null && (!arc1.onArc(ip2) || !arc2.onArc(ip2)))
         {
            ip2 = null;
         }
         if(!ip1 && !ip2)
         {
            return null;
         }
         if(Boolean(ip1) && !ip2)
         {
            return new Array(ip1);
         }
         if(Boolean(ip2) && !ip1)
         {
            return new Array(ip2);
         }
         if(ip1.equals(ip2))
         {
            return new Array(ip1);
         }
         if(ip1.x < ip2.x)
         {
            returnarray = new Array(ip1,ip2);
         }
         else
         {
            returnarray = new Array(ip2,ip1);
         }
         return returnarray;
      }
      
      public function nestPaths() : void
      {
         var child:DisplayObject = null;
         var cutpath:CutPath = null;
         var j:* = 0;
         var cutlist:Array = new Array();
         for(var i:int = 0; i < numChildren; i++)
         {
            child = getChildAt(i);
            if(child is CutPath)
            {
               cutlist.push(child);
            }
         }
         for(i = 0; i < cutlist.length; i++)
         {
            cutpath = cutlist[i];
            for(j = 0; j < cutlist.length; j++)
            {
               if(cutpath != cutlist[j])
               {
                  if(cutpath.containsPoint(cutlist[j].seglist[0].p1))
                  {
                     cutpath.addChild(cutlist[j]);
                     cutlist.splice(j,1);
                     j--;
                  }
                  else if(cutlist[j].containsPoint(cutpath.seglist[0].p1))
                  {
                     cutlist[j].addChild(cutpath);
                  }
               }
            }
         }
         for(i = 0; i < numChildren; i++)
         {
            child = getChildAt(i);
            if(child is CutPath)
            {
               cutpath = child as CutPath;
               cutpath.nestPaths();
            }
         }
      }
      
      public function containsPoint(point:Point) : Boolean
      {
         var seg:Segment = null;
         var odd:Boolean = false;
         var i:int = 0;
         var arc:CircularArc = null;
         var points:Array = null;
         var ip:Point = null;
         var intersections:Array = new Array();
         var ylevel:Number = point.y;
         var v1:Point = new Point(0,ylevel);
         var v2:Point = new Point(1,ylevel);
         var hsegment:Segment = new Segment(v1,v2);
         for each(seg in seglist)
         {
            if(seg.p1.y > ylevel && seg.p2.y < ylevel || seg.p1.y < ylevel && seg.p2.y > ylevel)
            {
               if(seg is CircularArc)
               {
                  arc = seg as CircularArc;
                  points = this.lineArcIntersect(hsegment,arc,false);
                  if(points != null)
                  {
                     if(points[0])
                     {
                        intersections.push(points[0].x);
                     }
                     if(points[1])
                     {
                        intersections.push(points[1].x);
                     }
                  }
               }
               else
               {
                  ip = Global.lineIntersect(seg.p1,seg.p2,v1,v2,false);
                  if(ip != null)
                  {
                     intersections.push(ip.x);
                  }
               }
            }
            else if(!(seg is CircularArc) && seg.p1.y == ylevel && seg.p2.y == ylevel)
            {
               intersections.push(seg.p1.x);
               intersections.push(seg.p2.x);
            }
            else if(seg is CircularArc && seg.p1.y == ylevel && seg.p2.y == ylevel)
            {
               intersections.push(seg.p1.x);
               intersections.push(seg.p2.x);
            }
         }
         intersections.sort(Array.NUMERIC);
         odd = true;
         for(i = 0; i < intersections.length; i++)
         {
            odd = !odd;
            if(point.x < intersections[i])
            {
               return odd;
            }
         }
         return false;
      }
      
      public function setChildrenDirection(dir:int) : void
      {
         var child:DisplayObject = null;
         var cutpath:CutPath = null;
         for(var i:int = 0; i < numChildren; i++)
         {
            child = getChildAt(i);
            if(child is CutPath)
            {
               cutpath = child as CutPath;
               cutpath.setDirection(dir);
               if(dir == 1)
               {
                  cutpath.setChildrenDirection(2);
               }
               else
               {
                  cutpath.setChildrenDirection(1);
               }
            }
         }
      }
      
      public function getChildren() : Array
      {
         var cutpath:CutPath = null;
         var childarray:Array = null;
         var returnarray:Array = new Array();
         for(var i:int = 0; i < numChildren; i++)
         {
            cutpath = getChildAt(i) as CutPath;
            if(cutpath != null)
            {
               childarray = cutpath.getChildren();
               returnarray = returnarray.concat(childarray);
               returnarray.push(cutpath);
            }
         }
         return returnarray;
      }
      
      public function getNumChildren() : int
      {
         var cutpath:CutPath = null;
         var children:int = 0;
         for(var i:int = 0; i < numChildren; i++)
         {
            cutpath = getChildAt(i) as CutPath;
            if(cutpath != null)
            {
               children++;
            }
         }
         return children;
      }
      
      public function rotateChildren() : void
      {
         var cutpath:CutPath = null;
         var depthdiff:int = 0;
         var children:Array = this.getChildren();
         if(children.length == 0)
         {
            return;
         }
         var prev:CutPath = children[0];
         for(var i:int = 1; i < children.length; i++)
         {
            cutpath = children[i];
            if(cutpath != null)
            {
               depthdiff = cutpath.pocketdepth - prev.pocketdepth;
               if(prev != cutpath && (depthdiff == -1 || depthdiff == 1) && (prev.parent == cutpath || cutpath.parent == prev))
               {
                  cutpath.setStart(prev.seglist[0].p1);
               }
               prev = cutpath;
            }
         }
      }
      
      public function setStart(p:Point) : void
      {
         var d2:Number = NaN;
         var closest:int = 0;
         var mindis:Number = Math.pow(seglist[0].p1.x - p.x,2) + Math.pow(seglist[0].p1.y - p.y,2);
         for(var i:int = 0; i < seglist.length; i++)
         {
            d2 = Math.pow(seglist[i].p1.x - p.x,2) + Math.pow(seglist[i].p1.y - p.y,2);
            if(d2 < mindis)
            {
               mindis = d2;
               closest = i;
            }
         }
         var newseglist1:Array = seglist.slice(closest);
         var newseglist2:Array = seglist.slice(0,closest);
         seglist = newseglist1.concat(newseglist2);
      }
      
      public function drawStartArrow() : void
      {
         graphics.clear();
         this.drawArrow(seglist[0],5);
      }
      
      public function drawArrows(size:int) : void
      {
         var seg:Segment = null;
         graphics.clear();
         for each(seg in seglist)
         {
            this.drawArrow(seg,size);
         }
      }
      
      public function drawArrow(seg:*, size:int) : void
      {
         var normal:Point = null;
         var tangent:Point = null;
         var angle:Number = NaN;
         if(!seg || !seg.p1 || !seg.p2)
         {
            return;
         }
         if(seg is CircularArc)
         {
            angle = Global.getAngle(new Point(seg.p1.x - seg.center.x,seg.p1.y - seg.center.y),new Point(seg.p2.x - seg.center.x,seg.p2.y - seg.center.y));
            if(angle > 0)
            {
               normal = new Point(seg.p1.x - seg.center.x,seg.p1.y - seg.center.y);
            }
            else
            {
               normal = new Point(-seg.p1.x + seg.center.x,-seg.p1.y + seg.center.y);
            }
            tangent = new Point(-normal.y,normal.x);
         }
         else
         {
            tangent = new Point(seg.p2.x - seg.p1.x,seg.p2.y - seg.p1.y);
            normal = new Point(-tangent.y,tangent.x);
         }
         tangent.normalize(size);
         normal.normalize(size);
         var p1:Point = seg.p1.clone();
         p1.x *= Global.zoom;
         p1.y *= Global.zoom;
         p1 = p1.add(tangent);
         var p2:Point = seg.p1.clone();
         p2.x *= Global.zoom;
         p2.y *= Global.zoom;
         p2 = p2.add(normal);
         var p3:Point = seg.p1.clone();
         p3.x *= Global.zoom;
         p3.y *= Global.zoom;
         p3 = p3.subtract(normal);
         p1.y = -p1.y;
         p2.y = -p2.y;
         p3.y = -p3.y;
         graphics.lineStyle(1,39185,1,false,LineScaleMode.NONE);
         graphics.beginFill(39185);
         graphics.moveTo(p1.x,p1.y);
         graphics.lineTo(p2.x,p2.y);
         graphics.lineTo(p3.x,p3.y);
         graphics.lineTo(p1.x,p1.y);
         graphics.endFill();
      }
      
      public function getExactBounds() : Rectangle
      {
         var lmaxx:Number = NaN;
         var lmaxy:Number = NaN;
         var lminx:Number = NaN;
         var lminy:Number = NaN;
         var rect:Rectangle = null;
         var maxx:Number = Number(seglist[0].p1.x);
         var maxy:Number = Number(seglist[0].p1.y);
         var minx:Number = Number(seglist[0].p1.x);
         var miny:Number = Number(seglist[0].p1.y);
         for(var i:int = 0; i < seglist.length; i++)
         {
            if(seglist[i] is CircularArc)
            {
               rect = seglist[i].getExactBounds();
               lmaxx = rect.x + rect.width;
               lmaxy = rect.y + rect.height;
               lminx = rect.x;
               lminy = rect.y;
            }
            else
            {
               lmaxx = Math.max(seglist[i].p1.x,seglist[i].p2.x);
               lmaxy = Math.max(seglist[i].p1.y,seglist[i].p2.y);
               lminx = Math.min(seglist[i].p1.x,seglist[i].p2.x);
               lminy = Math.min(seglist[i].p1.y,seglist[i].p2.y);
            }
            if(lminx < minx)
            {
               minx = lminx;
            }
            if(lminy < miny)
            {
               miny = lminy;
            }
            if(lmaxx > maxx)
            {
               maxx = lmaxx;
            }
            if(lmaxy > maxy)
            {
               maxy = lmaxy;
            }
         }
         return new Rectangle(minx,miny,maxx - minx,maxy - miny);
      }
      
      public function getLength() : Number
      {
         if(!seglist || seglist.length == 0)
         {
            return 0;
         }
         var length:Number = 0;
         for(var i:int = 0; i < seglist.length; i++)
         {
            length += seglist[i].getLength();
         }
         return length;
      }
      
      public function addTabs(tabspacing:Number, tabwidth:Number, tabheight:Number, diameter:Number) : int
      {
         var tab:Tab = null;
         var length:Number = this.getLength();
         if(!this.tabs)
         {
            this.tabs = new Array();
         }
         var tabnum:int = Math.floor(length / tabspacing);
         for(var i:int = 0; i < tabnum; i++)
         {
            if(i * tabspacing + tabwidth > length)
            {
               break;
            }
            tab = new Tab(i * tabspacing,tabwidth,tabheight,diameter);
            this.addTab(tab);
         }
         this.tabs.sortOn("location",Array.NUMERIC);
         return tabnum;
      }
      
      public function addTab(tab:Tab) : void
      {
         this.tabs.push(tab);
         tab.addEventListener(MouseEvent.MOUSE_DOWN,this.tabDown);
      }
      
      private function tabDown(e:MouseEvent) : void
      {
         for(var i:int = 0; i < this.tabs.length; i++)
         {
            this.tabs[i].setInactive();
         }
         var tab:Tab = e.target as Tab;
         tab.setActive();
         this.dragtab = tab;
         stage.addEventListener(MouseEvent.MOUSE_UP,this.tabUp);
         stage.addEventListener(MouseEvent.MOUSE_MOVE,this.tabMove);
         Global.dragging = true;
         this.tabpositions = this.getTabPositions();
         e.stopPropagation();
      }
      
      private function tabUp(e:MouseEvent) : void
      {
         var min:Number = NaN;
         var max:Number = NaN;
         Global.dragging = false;
         var tab:Tab = e.target as Tab;
         stage.removeEventListener(MouseEvent.MOUSE_UP,this.tabUp);
         stage.removeEventListener(MouseEvent.MOUSE_MOVE,this.tabMove);
         this.tabs.sortOn("location",Array.NUMERIC);
         for(var i:int = 0; i < this.tabs.length; i++)
         {
            if(this.tabs[i] != this.dragtab)
            {
               if(this.tabs[i].location <= this.dragtab.location && this.dragtab.location < this.tabs[i].location + this.tabs[i].tabwidth || this.dragtab.location <= this.tabs[i].location && this.tabs[i].location < this.dragtab.location + this.dragtab.tabwidth)
               {
                  min = Math.min(this.dragtab.location,this.tabs[i].location);
                  max = Math.max(this.dragtab.location + this.dragtab.tabwidth,this.tabs[i].location + this.tabs[i].tabwidth);
                  if(max > this.dragtab.location + this.dragtab.tabwidth)
                  {
                     this.dragtab.tabwidth = max - min;
                  }
                  if(min < this.dragtab.location)
                  {
                     this.dragtab.location = min;
                     this.dragtab.x = this.tabs[i].x;
                     this.dragtab.y = this.tabs[i].y;
                     this.dragtab.rotation = this.tabs[i].rotation;
                  }
                  this.dragtab.redraw();
                  if(contains(this.tabs[i]))
                  {
                     removeChild(this.tabs[i]);
                  }
                  this.tabs.splice(i,1);
               }
            }
         }
         var length:Number = this.getLength();
         if(this.dragtab.location + this.dragtab.tabwidth > length)
         {
            this.dragtab.location = length - this.dragtab.tabwidth;
         }
         this.tabpositions = null;
         this.dragtab = null;
      }
      
      private function tabMove(e:MouseEvent) : void
      {
         var mousepoint:Point = new Point(this.mouseX / Global.zoom,-this.mouseY / Global.zoom);
         var tabobj:Object = this.getClosestPosition(mousepoint);
         this.dragtab.x = tabobj.point.x * Global.zoom;
         this.dragtab.y = -tabobj.point.y * Global.zoom;
         this.dragtab.rotation = tabobj.rotation;
         this.dragtab.location = tabobj.location - this.dragtab.tabwidth / 2;
         if(this.dragtab.location < 0)
         {
            this.dragtab.location += this.getLength();
         }
      }
      
      public function getTabPositions() : Array
      {
         var seglength:Number = NaN;
         var point:Point = null;
         var normal:Point = null;
         var angle:Number = NaN;
         var obj:Object = null;
         var positions:Array = new Array();
         var length:Number = this.getLength();
         var increment:Number = length / 1000;
         var current:Number = 0;
         var locus:Number = 0;
         for(var i:int = 0; i < seglist.length; i++)
         {
            seglength = Number(seglist[i].getLength());
            while(positions.length < 1000)
            {
               if(!(locus <= current && current < locus + seglength))
               {
                  break;
               }
               point = seglist[i].getPointFromLength(current - locus);
               if(seglist[i] is CircularArc)
               {
                  normal = new Point(point.x - seglist[i].center.x,point.y - seglist[i].center.y);
               }
               else
               {
                  normal = seglist[i].getNormal();
               }
               angle = Math.atan2(-normal.y,normal.x);
               angle *= 180 / Math.PI;
               obj = {
                  "location":current,
                  "point":point,
                  "rotation":angle
               };
               positions.push(obj);
               current += increment;
            }
            locus += seglength;
         }
         return positions;
      }
      
      public function getClosestPosition(p:Point) : Object
      {
         var dis2:Number = NaN;
         if(!this.tabpositions || this.tabpositions.length == 0)
         {
            return null;
         }
         var min:Number = Math.pow(this.tabpositions[0].point.x - p.x,2) + Math.pow(this.tabpositions[0].point.y - p.y,2);
         var minobj:Object = this.tabpositions[0];
         for(var i:int = 0; i < this.tabpositions.length; i++)
         {
            dis2 = Math.pow(this.tabpositions[i].point.x - p.x,2) + Math.pow(this.tabpositions[i].point.y - p.y,2);
            if(dis2 < min)
            {
               min = dis2;
               minobj = this.tabpositions[i];
            }
         }
         return minobj;
      }
      
      public function redrawTabs() : void
      {
         var seglength:Number = NaN;
         var tab:Tab = null;
         var center:Number = NaN;
         var point:Point = null;
         var normal:Point = null;
         var angle:Number = NaN;
         if(!this.tabs || this.tabs.length == 0)
         {
            return;
         }
         var locus:Number = 0;
         var tablist:Array = this.tabs.slice();
         for(var i:int = 0; i < seglist.length; i++)
         {
            if(tablist.length == 0)
            {
               break;
            }
            seglength = Number(seglist[i].getLength());
            while(tablist.length > 0)
            {
               tab = tablist[0];
               center = tab.location + tab.tabwidth / 2;
               if(!(locus <= center && center < locus + seglength))
               {
                  break;
               }
               point = seglist[i].getPointFromLength(center - locus);
               if(seglist[i] is CircularArc)
               {
                  normal = new Point(point.x - seglist[i].center.x,point.y - seglist[i].center.y);
               }
               else
               {
                  normal = seglist[i].getNormal();
               }
               angle = Math.atan2(-normal.y,normal.x);
               angle *= 180 / Math.PI;
               addChild(tab);
               tab.x = point.x * Global.zoom;
               tab.y = -point.y * Global.zoom;
               tab.rotation = angle;
               tab.redraw();
               tablist.shift();
            }
            locus += seglength;
         }
      }
      
      public function removeActiveTabs() : void
      {
         if(!this.tabs || this.tabs.length == 0)
         {
            return;
         }
         for(var i:* = 0; i < this.tabs.length; i++)
         {
            if(this.tabs[i].active == true)
            {
               this.tabs[i].removeEventListener(MouseEvent.MOUSE_DOWN,this.tabDown);
               if(contains(this.tabs[i]))
               {
                  removeChild(this.tabs[i]);
               }
               this.tabs.splice(i,1);
               i--;
            }
         }
      }
      
      public function processTabs() : CutPath
      {
         var tab:Tab = null;
         var seglength:Number = NaN;
         var split:Array = null;
         if(!this.tabs || this.tabs.length == 0)
         {
            return this;
         }
         var newseglist:Array = seglist.slice();
         var locus:Number = 0;
         var tablist:Array = this.tabs.slice();
         var i:int = 0;
         var current:int = 0;
         while(tablist.length > 0)
         {
            tab = tablist.shift();
            seglength = 0;
            for(i = current; i < newseglist.length; i++)
            {
               seglength = Number(newseglist[i].getLength());
               if(locus <= tab.location && tab.location < locus + seglength)
               {
                  break;
               }
               locus += seglength;
            }
            current = i;
            if(current == newseglist.length)
            {
               break;
            }
            if(locus == tab.location)
            {
               tab.p1 = newseglist[current].p1;
            }
            else
            {
               split = newseglist[current].splitByLength(tab.location - locus);
               tab.p1 = split[0].p2;
               newseglist.splice(current,1,split[0],split[1]);
            }
            for(i = current; i < newseglist.length; i++)
            {
               seglength = Number(newseglist[i].getLength());
               if(locus <= tab.location + tab.tabwidth && tab.location + tab.tabwidth < locus + seglength)
               {
                  break;
               }
               locus += seglength;
            }
            current = i;
            if(current == newseglist.length)
            {
               break;
            }
            if(locus == tab.location + tab.tabwidth)
            {
               tab.p2 = newseglist[current].p1;
            }
            else
            {
               split = newseglist[current].splitByLength(tab.location + tab.tabwidth - locus);
               tab.p2 = split[0].p2;
               newseglist.splice(i,1,split[0],split[1]);
            }
         }
         var cutpath:CutPath = new CutPath();
         cutpath.seglist = newseglist;
         cutpath.tabs = this.tabs;
         return cutpath;
      }
   }
}

