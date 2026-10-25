package com.partkart
{
   import com.lorentz.SVG.*;
   import flash.geom.Matrix;
   import flash.geom.Point;
   import flash.geom.Transform;
   
   public class SVGToPath
   {
      
      private var pathlist:Array = new Array();
      
      private var viewboxes:Array = new Array();
      
      private var svgboxes:Array = new Array();
      
      private var currentFontSize:Number = 0.16666666666666666;
      
      private var svg_object:Object;
      
      protected const WIDTH:String = "width";
      
      protected const HEIGHT:String = "height";
      
      protected const WIDTH_HEIGHT:String = "width_height";
      
      public function SVGToPath()
      {
         super();
      }
      
      public function parse(e:Object, trans:Matrix = null) : Array
      {
         var p:Path = null;
         var svgbox:Object = null;
         if(e.type == "svg")
         {
            this.svg_object = e;
            svgbox = new Object();
            svgbox.heightunit = this.getUnitType(e.height);
            svgbox.widthunit = this.getUnitType(e.width);
            svgbox.height = StringUtil.remove(e.height,this.getUnitType(e.height));
            svgbox.width = StringUtil.remove(e.width,this.getUnitType(e.width));
            svgbox.viewbox = e.viewBox;
            this.svgboxes.push(svgbox);
         }
         this.inheritStyles(e);
         var pushed:Boolean = false;
         if(e.viewBox != null)
         {
            this.viewboxes.push(e.viewBox);
            pushed = true;
         }
         if(Boolean(e.finalStyle) && e.finalStyle["font-size"] != null)
         {
            this.currentFontSize = this.getUnit(e.finalStyle["font-size"],this.HEIGHT);
         }
         switch(e.type)
         {
            case "svg":
               this.parseSvg(e,trans);
               break;
            case "rect":
               p = this.parseRect(e);
               break;
            case "path":
               p = this.parsePath(e);
               break;
            case "polygon":
               p = this.parsePoly(e,true);
               break;
            case "polyline":
               p = this.parsePoly(e,false);
               break;
            case "line":
               p = this.parseLine(e);
               break;
            case "circle":
               p = this.parseCircle(e);
               break;
            case "ellipse":
               p = this.parseEllipse(e);
               break;
            case "g":
               this.parseG(e,trans);
               break;
            case "text":
               this.parseText(e);
         }
         if(pushed == true)
         {
            this.viewboxes.pop();
         }
         if(e.type == "svg")
         {
            this.svgboxes.pop();
         }
         if(p != null)
         {
            if(trans)
            {
               p.matrixTransform(this.getMatrixUnits(trans));
            }
            if(e.transform)
            {
               if(e.transform is Transform)
               {
                  p.matrixTransform(this.getMatrixUnits(e.transform.matrix));
               }
               else if(e.transform is Matrix)
               {
                  p.matrixTransform(this.getMatrixUnits(e.transform));
               }
            }
            this.pathlist.push(p);
         }
         return this.pathlist;
      }
      
      private function parseSvg(e:Object, m:Matrix = null) : void
      {
         var trans:Matrix = null;
         var element:Object = null;
         if(Boolean(e.transform) && Boolean(m))
         {
            if(e.transform is Transform)
            {
               trans = e.transform.matrix.clone();
            }
            else if(e.transform is Matrix)
            {
               trans = e.transform.clone();
            }
            trans.concat(m);
         }
         else if(e.transform)
         {
            if(e.transform is Transform)
            {
               trans = e.transform.matrix.clone();
            }
            else if(e.transform is Matrix)
            {
               trans = e.transform.clone();
            }
         }
         else if(m)
         {
            trans = m.clone();
         }
         for each(element in e.children)
         {
            this.parse(element,trans);
         }
      }
      
      public function parseRect(e:Object) : Path
      {
         var s1:Segment = null;
         var s2:Segment = null;
         var s3:Segment = null;
         var s4:Segment = null;
         var r1:ArcSegment = null;
         var r2:ArcSegment = null;
         var r3:ArcSegment = null;
         var r4:ArcSegment = null;
         var x:Number = this.getUnit(e.x,this.WIDTH);
         var y:Number = this.getUnit(e.y,this.HEIGHT);
         var width:Number = this.getUnit(e.width,this.WIDTH);
         var height:Number = this.getUnit(e.height,this.HEIGHT);
         var p:Path = new Path();
         var rx:Number = this.getUnit(e.rx,this.WIDTH);
         var ry:Number = this.getUnit(e.ry,this.HEIGHT);
         if(Boolean(e.isRound) && (rx != 0 || ry != 0))
         {
            if(rx == 0)
            {
               rx = ry;
            }
            if(ry == 0)
            {
               ry = rx;
            }
            if(rx > width / 2)
            {
               rx = width / 2;
            }
            if(ry > height / 2)
            {
               ry = height / 2;
            }
            r1 = new ArcSegment(new Point(x,y + ry),new Point(x + rx,y),rx,ry,0,false,true);
            s1 = new Segment(r1.p2,new Point(x + width - rx,y));
            r2 = new ArcSegment(s1.p2,new Point(x + width,y + ry),rx,ry,0,false,true);
            s2 = new Segment(r2.p2,new Point(x + width,y + height - ry));
            r3 = new ArcSegment(s2.p2,new Point(x + width - rx,y + height),rx,ry,0,false,true);
            s3 = new Segment(r3.p2,new Point(x + rx,y + height));
            r4 = new ArcSegment(s3.p2,new Point(x,y + height - rx),rx,ry,0,false,true);
            s4 = new Segment(r4.p2,r1.p1);
            p.addSegment(r1);
            p.addSegment(s1);
            p.addSegment(r2);
            p.addSegment(s2);
            p.addSegment(r3);
            p.addSegment(s3);
            p.addSegment(r4);
            p.addSegment(s4);
         }
         else
         {
            s1 = new Segment(new Point(x,y),new Point(x + width,y));
            s2 = new Segment(s1.p2,new Point(x + width,y + height));
            s3 = new Segment(s2.p2,new Point(x,y + height));
            s4 = new Segment(s3.p2,s1.p1);
            p.addSegment(s1);
            p.addSegment(s2);
            p.addSegment(s3);
            p.addSegment(s4);
         }
         if(p.getNumSeg() > 0)
         {
            return p;
         }
         return null;
      }
      
      private function parsePath(e:Object) : Path
      {
         var pathparser:PathParser = new PathParser(this);
         var p:Path = pathparser.parse(e.d);
         if(e.id != null && p != null)
         {
            p.name = String(e.id);
         }
         return p;
      }
      
      private function parsePoly(e:Object, ispoly:Boolean) : Path
      {
         var i:int = 0;
         var cpoint:Point = null;
         var opoint:Point = null;
         var npoint:Point = null;
         var seg:Segment = null;
         var seg1:Segment = null;
         var p:Path = new Path();
         var args:Array = e.points;
         if(args.length >= 4 && args.length % 2 == 0)
         {
            i = 2;
            cpoint = new Point(this.getUnit(args[0],this.WIDTH),this.getUnit(args[1],this.HEIGHT));
            opoint = cpoint;
            while(i < args.length - 1)
            {
               npoint = new Point(this.getUnit(args[i],this.WIDTH),this.getUnit(args[i + 1],this.HEIGHT));
               seg = new Segment(cpoint,npoint);
               p.addSegment(seg);
               cpoint = npoint;
               i += 2;
            }
            if(ispoly && !cpoint.equals(opoint))
            {
               seg1 = new Segment(cpoint,opoint);
               p.addSegment(seg1);
            }
            return p;
         }
         return null;
      }
      
      private function parseLine(e:Object) : Path
      {
         var seg:Segment = null;
         var p:Path = null;
         var x1:Number = this.getUnit(e.x1,this.WIDTH);
         var y1:Number = this.getUnit(e.y1,this.HEIGHT);
         var x2:Number = this.getUnit(e.x2,this.WIDTH);
         var y2:Number = this.getUnit(e.y2,this.HEIGHT);
         if(!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2))
         {
            seg = new Segment(new Point(x1,y1),new Point(x2,y2));
            p = new Path();
            p.addSegment(seg);
            return p;
         }
         return null;
      }
      
      private function parseCircle(e:Object) : Path
      {
         var a1:ArcSegment = null;
         var a2:ArcSegment = null;
         var p:Path = null;
         var cx:Number = this.getUnit(e.cx,this.WIDTH);
         var cy:Number = this.getUnit(e.cy,this.HEIGHT);
         var r:Number = this.getUnit(e.r,this.WIDTH);
         if(!isNaN(cx) && !isNaN(cy) && !isNaN(r))
         {
            a1 = new ArcSegment(new Point(cx - r,cy),new Point(cx + r,cy),r / 1000,r / 1000,0,false,false);
            a2 = new ArcSegment(a1.p1,a1.p2,r / 1000,r / 1000,0,false,true);
            p = new Path();
            p.addSegment(a1);
            p.addSegment(a2);
            return p;
         }
         return null;
      }
      
      public function parseEllipse(e:Object) : Path
      {
         var a1:ArcSegment = null;
         var a2:ArcSegment = null;
         var p:Path = null;
         var cx:Number = this.getUnit(e.cx,this.WIDTH);
         var cy:Number = this.getUnit(e.cy,this.HEIGHT);
         var rx:Number = this.getUnit(e.rx,this.WIDTH);
         var ry:Number = this.getUnit(e.ry,this.HEIGHT);
         if(!isNaN(cx) && !isNaN(cy) && !isNaN(rx) && !isNaN(ry))
         {
            a1 = new ArcSegment(new Point(cx - rx,cy),new Point(cx + rx,cy),rx / 1000,ry / 1000,0,false,false);
            a2 = new ArcSegment(a1.p1,a1.p2,rx / 1000,ry / 1000,0,false,true);
            p = new Path();
            p.addSegment(a1);
            p.addSegment(a2);
            return p;
         }
         return null;
      }
      
      private function parseG(e:Object, m:Matrix = null) : void
      {
         var trans:Matrix = null;
         var element:Object = null;
         if(Boolean(e.transform) && Boolean(m))
         {
            if(e.transform is Transform)
            {
               trans = e.transform.matrix.clone();
            }
            else if(e.transform is Matrix)
            {
               trans = e.transform.clone();
            }
            trans.concat(m);
         }
         else if(e.transform)
         {
            if(e.transform is Transform)
            {
               trans = e.transform.matrix.clone();
            }
            else if(e.transform is Matrix)
            {
               trans = e.transform.clone();
            }
         }
         else if(m)
         {
            trans = m.clone();
         }
         for each(element in e.children)
         {
            this.parse(element,trans);
         }
      }
      
      private function parseText(e:Object) : void
      {
      }
      
      public function getUnit(s:String, viewBoxReference:String = "") : Number
      {
         var value:Number = NaN;
         var currentViewBox:Object = null;
         var sbox:Object = null;
         if(s == null)
         {
            return 0;
         }
         if(s.indexOf("pt") != -1)
         {
            value = Number(StringUtil.remove(s,"pt"));
            value /= 72;
         }
         else if(s.indexOf("pc") != -1)
         {
            value = Number(StringUtil.remove(s,"pc"));
            value = value * 12 / 72;
         }
         else if(s.indexOf("mm") != -1)
         {
            value = Number(StringUtil.remove(s,"mm"));
            value /= 25.4;
         }
         else if(s.indexOf("cm") != -1)
         {
            value = Number(StringUtil.remove(s,"cm"));
            value /= 2.54;
         }
         else if(s.indexOf("in") != -1)
         {
            value = Number(StringUtil.remove(s,"in"));
         }
         else if(s.indexOf("px") != -1)
         {
            value = Number(StringUtil.remove(s,"px"));
            value /= Global.importres;
         }
         else if(s.indexOf("em") != -1)
         {
            value = Number(StringUtil.remove(s,"em"));
            value *= this.currentFontSize;
         }
         else if(s.indexOf("%") != -1)
         {
            value = Number(StringUtil.remove(s,"%"));
            currentViewBox = this.viewboxes[this.viewboxes.length - 1];
            switch(viewBoxReference)
            {
               case this.WIDTH:
                  value = value / 100 * this.getUnit(currentViewBox.width);
                  break;
               case this.HEIGHT:
                  value = value / 100 * this.getUnit(currentViewBox.height);
                  break;
               default:
                  value = value / 100 * Math.sqrt(Math.pow(this.getUnit(currentViewBox.width),2) + Math.pow(this.getUnit(currentViewBox.height),2)) / Math.sqrt(2);
            }
         }
         else if(viewBoxReference != "" && this.svgboxes.length > 0 && this.svgboxes[this.svgboxes.length - 1].viewbox != null)
         {
            sbox = this.svgboxes[this.svgboxes.length - 1];
            if(viewBoxReference == this.WIDTH && sbox.width != null)
            {
               value = this.getUnit(Number(s) * (sbox.width / sbox.viewbox.width) + sbox.widthunit);
            }
            if(viewBoxReference == this.HEIGHT && sbox.height != null)
            {
               value = this.getUnit(Number(s) * (sbox.height / sbox.viewbox.height) + sbox.heightunit);
            }
            if(Global.unit == "cm")
            {
               value /= 2.54;
            }
         }
         else
         {
            value = Number(s) / Global.importres;
         }
         if(Global.unit == "in")
         {
            return value;
         }
         if(Global.unit == "cm")
         {
            return value * 2.54;
         }
         return NaN;
      }
      
      public function getUnitType(s:String) : String
      {
         if(s.indexOf("pt") != -1)
         {
            return "pt";
         }
         if(s.indexOf("pc") != -1)
         {
            return "pc";
         }
         if(s.indexOf("mm") != -1)
         {
            return "mm";
         }
         if(s.indexOf("cm") != -1)
         {
            return "cm";
         }
         if(s.indexOf("in") != -1)
         {
            return "in";
         }
         if(s.indexOf("px") != -1)
         {
            return "px";
         }
         if(s.indexOf("em") != -1)
         {
            return "em";
         }
         if(s.indexOf("%") != -1)
         {
            return "%";
         }
         return "";
      }
      
      private function getMatrixUnits(m:Matrix) : Matrix
      {
         var sbox:Object = null;
         var matrix:Matrix = m.clone();
         if(this.svgboxes.length > 0 && this.svgboxes[this.svgboxes.length - 1].viewbox != null)
         {
            sbox = this.svgboxes[this.svgboxes.length - 1];
            matrix.tx = this.getUnit(matrix.tx * (sbox.width / sbox.viewbox.width) + sbox.widthunit);
            matrix.ty = this.getUnit(matrix.ty * (sbox.height / sbox.viewbox.height) + sbox.heightunit);
         }
         else
         {
            matrix.tx /= Global.importres;
            matrix.ty /= Global.importres;
            if(Global.unit == "cm")
            {
               matrix.tx *= 2.54;
               matrix.ty *= 2.54;
            }
         }
         return matrix;
      }
      
      private function inheritStyles(elt:Object) : void
      {
         var className:String = null;
         if(elt.parent)
         {
            elt.finalStyle = elt.parent.finalStyle;
         }
         else
         {
            elt.finalStyle = new Object();
         }
         if(this.svg_object.styles[elt.type] != null)
         {
            elt.finalStyle = SVGUtil.mergeObjectStyles(elt.finalStyle,this.svg_object.styles[elt.type]);
         }
         if(elt["class"])
         {
            for each(className in String(elt["class"]).split(" "))
            {
               elt.finalStyle = SVGUtil.mergeObjectStyles(elt.finalStyle,this.svg_object.styles["." + className]);
            }
         }
         if(elt.style)
         {
            elt.finalStyle = SVGUtil.mergeObjectStyles(elt.finalStyle,elt.style);
         }
      }
   }
}

