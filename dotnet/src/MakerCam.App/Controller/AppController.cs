using System.Globalization;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Input;
using System.Windows.Media;
using Microsoft.Win32;
using MakerCam.Core;
using CoreMatrix = MakerCam.Core.Matrix;
using LineSegment = MakerCam.Core.LineSegment;

namespace MakerCam.App;

/// <summary>
/// Application controller, ported from <c>main.ts</c>. Owns the drawing model,
/// tools, undo history and command routing, and drives the WPF window.
/// </summary>
public sealed class AppController
{
    private const string AppName = "MakerCam Modern";
    private const int UndoLimit = 40;
    private const double PixelsPerMmAt100 = 96 / 25.4;

    private sealed class Snapshot
    {
        public List<Path> Paths { get; init; } = new();
        public List<Operation> Operations { get; init; } = new();
        public List<string> Selection { get; init; } = new();
        public string? SelectedOperationId { get; init; }
        public double? PageWidthMm { get; init; }
        public double? PageHeightMm { get; init; }
    }

    private sealed class Prefs
    {
        public string Unit { get; set; } = "mm";
        public double PxPerInch { get; set; } = 96;
        public double Tolerance { get; set; } = 0.02;
        public bool Grid { get; set; } = true;
        public bool Snap { get; set; }
        public bool ShowToolpaths { get; set; } = true;
        public bool ShowToolDiameter { get; set; }
        public double? WindowLeft { get; set; }
        public double? WindowTop { get; set; }
        public double? WindowWidth { get; set; }
        public double? WindowHeight { get; set; }
        public bool WindowMaximized { get; set; }
        public List<string> RecentFiles { get; set; } = new();
    }

    private enum DragKind
    {
        None,
        Pan,
        Band,
        Move,
    }

    private static readonly CultureInfo Inv = CultureInfo.InvariantCulture;

    private static readonly Dictionary<OperationType, string> TypeLabel = new()
    {
        [OperationType.Profile] = "Profile",
        [OperationType.Pocket] = "Pocket",
        [OperationType.Follow] = "Follow path",
        [OperationType.Drill] = "Drill",
        [OperationType.DrillPath] = "Holes along path",
    };

    private static readonly Dictionary<OperationType, Color> TypeColor = new()
    {
        [OperationType.Profile] = Color.FromRgb(0x12, 0x82, 0x4c),
        [OperationType.Pocket] = Color.FromRgb(0xc7, 0x7c, 0x08),
        [OperationType.Follow] = Color.FromRgb(0x7c, 0x3a, 0xed),
        [OperationType.Drill] = Color.FromRgb(0xd6, 0x28, 0x28),
        [OperationType.DrillPath] = Color.FromRgb(0xbe, 0x18, 0x5d),
    };

    private readonly MainWindow _window;
    private readonly DrawingCanvas _canvas;

    public List<Path> Paths { get; private set; } = new();
    public List<Operation> Operations { get; private set; } = new();
    public HashSet<string> Selection { get; private set; } = new();
    public string? SelectedOperationId { get; private set; }

    public Unit DisplayUnit { get; private set; } = Unit.Mm;
    public double PxPerInch { get; private set; } = 96;
    public double Tolerance { get; private set; } = 0.02;
    public View Camera { get; private set; } = View.Default;
    public Tool CurrentTool { get; private set; } = Tool.Select;
    public bool ShowGrid { get; private set; } = true;
    public bool ShowSnap { get; private set; }
    public bool ShowToolpaths { get; private set; } = true;
    public bool ShowToolDiameter { get; private set; }

    private string? _hoverPathId;
    private string? _hoverOperationId;

    private DragKind _dragKind;
    private Vec _dragStartScreen;
    private Vec _dragStartPan;
    private Vec _dragStartWorld;
    private bool _bandAdditive;
    private bool _dragMoved;
    private List<Path> _dragOriginals = new();
    private List<string> _dragIds = new();
    private Snapshot? _pendingSnapshot;
    private Rect? _rubberBand;

    private List<Vec> _penPoints = new();
    private Vec? _penCursor;
    private bool _spaceDown;
    private Vec _lastPointerScreen;
    private Vec _lastWorld;

    private readonly List<Snapshot> _undoStack = new();
    private readonly List<Snapshot> _redoStack = new();
    private List<Path> _clipboard = new();
    private readonly ConditionalWeakTable<Path, List<Vec>> _flattenCache = new();

    private int _nextPathId = 1;
    private int _nextOperationId = 1;
    private string? _nestBoundaryId;
    private bool _sidebarVisible = true;
    private bool _emptyStateDismissed;

    /// <summary>Page size of the imported document, kept when saving.</summary>
    private double? _pageWidthMm;
    private double? _pageHeightMm;

    private double? _windowLeft;
    private double? _windowTop;
    private double? _windowWidth;
    private double? _windowHeight;
    private bool _windowMaximized;

    private List<string> _recentFiles = new();
    private const int RecentFilesLimit = 10;

    /// <summary>Name of the file currently shown, or null for an unsaved project.</summary>
    private string? _documentName;

    private int _revision;
    private int _savedRevision;

    private bool IsDirty => _revision != _savedRevision;


    public AppController(MainWindow window)
    {
        _window = window;
        _canvas = window.DrawingArea;

        // Optional clean-slate switch: the uninstaller deliberately keeps
        // per-user settings, so this is the supported way to reset them.
        if (Environment.GetCommandLineArgs().Skip(1)
            .Any(a => string.Equals(a, "--reset-settings", StringComparison.OrdinalIgnoreCase)))
        {
            try { System.IO.File.Delete(PrefsPath); } catch { /* ignore */ }
        }

        LoadPrefs();
        ApplyWindowPlacement();
        BindInput();
    }

    /* ------------------------------------------------------------------ */
    /* Startup                                                             */
    /* ------------------------------------------------------------------ */

    public void Start()
    {
        UpdateTitle();
        _window.SetToolButtons(CurrentTool);
        _window.SetToggleStates(ShowGrid, ShowSnap, ShowToolpaths, ShowToolDiameter);
        _window.SetUnitSelection(DisplayUnit);
        UpdateRecentFilesMenu();
        RenderOperations();
        UpdateEmptyState();
        UpdateStatus();
        UpdateHint("Ready");
        Fit();
        RequestRender();

        var args = Environment.GetCommandLineArgs().Skip(1).ToList();
        if (args.Any(a => string.Equals(a, "--example", StringComparison.OrdinalIgnoreCase)))
        {
            LoadExample();
            return;
        }

        // A path argument comes from a file association or "Open with".
        var file = args.FirstOrDefault(a =>
            !a.StartsWith("--", StringComparison.Ordinal) && System.IO.File.Exists(a));
        if (file is not null) ReadFile(file);
    }

    private void BindInput()
    {
        _canvas.MouseDown += OnMouseDown;
        _canvas.MouseMove += OnMouseMove;
        _canvas.MouseUp += OnMouseUp;
        _window.PreviewKeyDown += OnKeyDown;
        _window.PreviewKeyUp += OnKeyUp;
        _window.PreviewMouseWheel += (_, e) =>
        {
            if (e.OriginalSource is not DependencyObject source) return;
            if (!IsWithin(source, _canvas)) return;
            var p = ToVec(e.GetPosition(_canvas));
            ZoomAt(p, e.Delta > 0 ? 1.12 : 1 / 1.12);
            e.Handled = true;
        };
    }

    private static bool IsWithin(DependencyObject? source, DependencyObject ancestor)
    {
        while (source is not null)
        {
            if (ReferenceEquals(source, ancestor)) return true;
            source = source is Visual or System.Windows.Media.Media3D.Visual3D
                ? VisualTreeHelper.GetParent(source)
                : LogicalTreeHelper.GetParent(source);
        }
        return false;
    }

    /* ------------------------------------------------------------------ */
    /* Preferences                                                         */
    /* ------------------------------------------------------------------ */

    private static string PrefsPath => System.IO.Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "MakerCam",
        "prefs.json");

    private void LoadPrefs()
    {
        try
        {
            if (!System.IO.File.Exists(PrefsPath)) return;
            var prefs = JsonSerializer.Deserialize<Prefs>(System.IO.File.ReadAllText(PrefsPath));
            if (prefs is null) return;
            DisplayUnit = Units.ParseUnit(prefs.Unit);
            PxPerInch = prefs.PxPerInch;
            Tolerance = prefs.Tolerance;
            ShowGrid = prefs.Grid;
            ShowSnap = prefs.Snap;
            ShowToolpaths = prefs.ShowToolpaths;
            ShowToolDiameter = prefs.ShowToolDiameter;
            _windowLeft = prefs.WindowLeft;
            _windowTop = prefs.WindowTop;
            _windowWidth = prefs.WindowWidth;
            _windowHeight = prefs.WindowHeight;
            _windowMaximized = prefs.WindowMaximized;
            _recentFiles = (prefs.RecentFiles ?? new List<string>())
                .Where(path => !string.IsNullOrWhiteSpace(path))
                .ToList();
        }
        catch
        {
            // Preferences are optional.
        }
    }

    public void SavePrefs()
    {
        try
        {
            var prefs = new Prefs
            {
                Unit = Units.ToCode(DisplayUnit),
                PxPerInch = PxPerInch,
                Tolerance = Tolerance,
                Grid = ShowGrid,
                Snap = ShowSnap,
                ShowToolpaths = ShowToolpaths,
                ShowToolDiameter = ShowToolDiameter,
                RecentFiles = _recentFiles.ToList(),
            };

            var bounds = _window.WindowState == WindowState.Normal
                ? new Rect(_window.Left, _window.Top, _window.Width, _window.Height)
                : _window.RestoreBounds;
            if (!bounds.IsEmpty && bounds.Width > 0 && bounds.Height > 0)
            {
                prefs.WindowLeft = bounds.Left;
                prefs.WindowTop = bounds.Top;
                prefs.WindowWidth = bounds.Width;
                prefs.WindowHeight = bounds.Height;
            }
            prefs.WindowMaximized = _window.WindowState == WindowState.Maximized;

            System.IO.Directory.CreateDirectory(System.IO.Path.GetDirectoryName(PrefsPath)!);
            System.IO.File.WriteAllText(PrefsPath, JsonSerializer.Serialize(prefs));
        }
        catch
        {
            // Saving preferences must never break the app.
        }
    }

    private void ApplyWindowPlacement()
    {
        var hasSavedPlacement = _windowWidth is not null && _windowHeight is not null;

        if (!hasSavedPlacement)
        {
            // First run (or after --reset-settings): open maximised.
            _window.WindowState = WindowState.Maximized;
            return;
        }

        if (_windowWidth is { } width && _windowHeight is { } height &&
            width >= _window.MinWidth && height >= _window.MinHeight)
        {
            _window.Width = width;
            _window.Height = height;
        }

        if (_windowLeft is { } left && _windowTop is { } top &&
            IsOnScreen(left, top, _window.Width, _window.Height))
        {
            _window.WindowStartupLocation = WindowStartupLocation.Manual;
            _window.Left = left;
            _window.Top = top;
        }

        // Honour an explicitly saved normal/maximised state.
        _window.WindowState = _windowMaximized ? WindowState.Maximized : WindowState.Normal;
    }

    private static bool IsOnScreen(double left, double top, double width, double height)
    {
        var screenLeft = SystemParameters.VirtualScreenLeft;
        var screenTop = SystemParameters.VirtualScreenTop;
        var screenRight = screenLeft + SystemParameters.VirtualScreenWidth;
        var screenBottom = screenTop + SystemParameters.VirtualScreenHeight;

        // Require a usable part of the window (including its title bar) to be
        // visible, so a monitor that has been unplugged cannot hide the app.
        return left + width > screenLeft + 80 &&
               left < screenRight - 80 &&
               top + 40 > screenTop &&
               top < screenBottom - 40;
    }

    /* ------------------------------------------------------------------ */
    /* Document state                                                      */
    /* ------------------------------------------------------------------ */

    private void MarkDirty()
    {
        _revision++;
        UpdateTitle();
    }

    private void MarkClean()
    {
        _savedRevision = _revision;
        UpdateTitle();
    }

    private void UpdateTitle()
    {
        var name = string.IsNullOrEmpty(_documentName) ? "Untitled" : _documentName;
        var dirty = IsDirty ? " *" : string.Empty;
        _window.Title = $"{name}{dirty} — {AppName}";
    }

    /// <summary>Asks to save before closing. Returns false to keep the window open.</summary>
    public bool ConfirmClose() => !IsDirty || ConfirmDiscard("closing");

    /// <summary>
    /// Offers Save / Discard / Cancel before an action that replaces the
    /// document. Returns true when the action should proceed.
    /// </summary>
    private bool ConfirmDiscard(string action)
    {
        if (!IsDirty) return true;

        var result = MessageBox.Show(
            _window,
            $"Save changes before {action}?",
            "MakerCam",
            MessageBoxButton.YesNoCancel,
            MessageBoxImage.Warning);

        return result switch
        {
            MessageBoxResult.Yes => Paths.Count == 0 || SaveProject(),
            MessageBoxResult.No => true,
            _ => false,
        };
    }

    /* ------------------------------------------------------------------ */
    /* Units and formatting                                                */
    /* ------------------------------------------------------------------ */

    private double ToDisplay(double mm) => DisplayUnit == Unit.In ? mm / 25.4 : mm;

    private double FromDisplay(double value) => DisplayUnit == Unit.In ? value * 25.4 : value;

    private string UnitLabel() => Units.ToCode(DisplayUnit);

    private string FmtLen(double mm, int digits = 2) =>
        ToDisplay(mm).ToString("F" + digits.ToString(Inv), Inv);

    private static Vec ToVec(Point p) => new(p.X, p.Y);

    private static Point ToPoint(Vec p) => new(p.X, p.Y);

    /* ------------------------------------------------------------------ */
    /* Pointer input                                                       */
    /* ------------------------------------------------------------------ */

    private void OnMouseDown(object sender, MouseButtonEventArgs e)
    {
        _canvas.Focus();
        var screen = ToVec(e.GetPosition(_canvas));
        OnPointerDown(screen, e.ChangedButton, Keyboard.Modifiers, e.ClickCount);
        e.Handled = true;
    }

    private void OnMouseMove(object sender, MouseEventArgs e)
    {
        OnPointerMove(ToVec(e.GetPosition(_canvas)));
    }

    private void OnMouseUp(object sender, MouseButtonEventArgs e)
    {
        OnPointerUp();
        e.Handled = true;
    }

    private Vec WorldPoint(Vec screen)
    {
        var world = ViewMath.ScreenToWorld(Camera, screen);
        return ShowSnap ? ApplySnap(world) : world;
    }

    private Vec ApplySnap(Vec p)
    {
        var step = DisplayUnit == Unit.In ? 2.54 : 1;
        return new Vec(
            Math.Round(p.X / step) * step,
            Math.Round(p.Y / step) * step);
    }

    private List<Vec> FlatPath(Path path) =>
        _flattenCache.GetValue(path, p => Geom.FlattenPath(p, 0.2));

    private Path? HitPath(Vec world)
    {
        var tolerance = 7 / Camera.Zoom;
        Path? best = null;
        var bestD = tolerance;
        foreach (var path in Paths)
        {
            var d = Geom.DistanceToPolyline(world, FlatPath(path), Geom.IsClosedPath(path));
            if (d < bestD)
            {
                bestD = d;
                best = path;
            }
        }
        return best;
    }

    private Operation? HitOperation(Vec world)
    {
        var tolerance = 7 / Camera.Zoom;
        Operation? best = null;
        var bestD = tolerance;
        foreach (var op in Operations)
        {
            if (!op.Visible || !op.Processed) continue;
            foreach (var loop in op.Loops)
            {
                var d = Geom.DistanceToPolyline(world, loop.Points, loop.Closed);
                if (d < bestD)
                {
                    bestD = d;
                    best = op;
                }
            }
            foreach (var p in op.DrillPoints)
            {
                var d = Geom.Dist(world, p);
                if (d < bestD)
                {
                    bestD = d;
                    best = op;
                }
            }
        }
        return best;
    }

    private void OnPointerDown(Vec screen, MouseButton button, ModifierKeys modifiers, int clicks)
    {
        _canvas.CaptureMouse();
        _lastPointerScreen = screen;
        var world = WorldPoint(screen);
        _lastWorld = world;
        UpdateStatusCoords(world);

        // Middle / right button, Space, or the pan tool pans the view.
        if (button is MouseButton.Middle or MouseButton.Right || _spaceDown || CurrentTool == Tool.Pan)
        {
            _dragKind = DragKind.Pan;
            _dragStartScreen = screen;
            _dragStartPan = new Vec(Camera.PanX, Camera.PanY);
            _canvas.Cursor = Cursors.ScrollAll;
            return;
        }

        if (button != MouseButton.Left) return;

        if (CurrentTool == Tool.Pen)
        {
            PenPointerDown(world);
            if (clicks == 2) FinishPen(false);
            return;
        }

        if (CurrentTool != Tool.Select) return;

        var path = HitPath(world);
        if (path?.Id is not null)
        {
            var additive = modifiers.HasFlag(ModifierKeys.Shift);
            if (additive)
            {
                if (!Selection.Remove(path.Id)) Selection.Add(path.Id);
                SelectedOperationId = null;
                UpdateSelectionUI();
                RequestRender();
                return;
            }

            if (!Selection.Contains(path.Id))
            {
                Selection.Clear();
                Selection.Add(path.Id);
            }
            SelectedOperationId = null;
            UpdateSelectionUI();

            _pendingSnapshot = CaptureSnapshot();
            _dragOriginals = Paths
                .Where(p => p.Id is not null && Selection.Contains(p.Id))
                .Select(p => p.Clone())
                .ToList();
            _dragIds = _dragOriginals.Select(p => p.Id!).ToList();
            _dragKind = DragKind.Move;
            _dragStartWorld = world;
            _dragMoved = false;
            _canvas.Cursor = Cursors.SizeAll;
            RequestRender();
            return;
        }

        var op = HitOperation(world);
        if (op is not null)
        {
            SelectedOperationId = op.Id;
            UpdateSelectionUI();
            RenderOperations();
            RequestRender();
            return;
        }

        if (!modifiers.HasFlag(ModifierKeys.Shift))
        {
            Selection.Clear();
            SelectedOperationId = null;
            UpdateSelectionUI();
        }
        _dragKind = DragKind.Band;
        _bandAdditive = modifiers.HasFlag(ModifierKeys.Shift);
        _rubberBand = new Rect(screen.X, screen.Y, 0, 0);
        RequestRender();
    }

    private void OnPointerMove(Vec screen)
    {
        var world = WorldPoint(screen);
        _lastPointerScreen = screen;
        _lastWorld = world;
        UpdateStatusCoords(world);

        if (_dragKind == DragKind.None)
        {
            if (CurrentTool == Tool.Pen)
            {
                _penCursor = world;
                RequestRender();
                return;
            }
            if (CurrentTool == Tool.Select)
            {
                var path = HitPath(world);
                var op = path is null ? HitOperation(world) : null;
                var newHover = path?.Id;
                if (newHover != _hoverPathId)
                {
                    _hoverPathId = newHover;
                    RequestRender();
                }
                _hoverOperationId = op?.Id;
                UpdateCursor();
            }
            return;
        }

        switch (_dragKind)
        {
            case DragKind.Pan:
                Camera = Camera with
                {
                    PanX = _dragStartPan.X + (screen.X - _dragStartScreen.X),
                    PanY = _dragStartPan.Y + (screen.Y - _dragStartScreen.Y),
                };
                RequestRender();
                return;

            case DragKind.Band:
                _rubberBand = new Rect(
                    _dragStartScreen.X,
                    _dragStartScreen.Y,
                    screen.X - _dragStartScreen.X,
                    screen.Y - _dragStartScreen.Y);
                RequestRender();
                return;

            case DragKind.Move:
            {
                var dx = world.X - _dragStartWorld.X;
                var dy = world.Y - _dragStartWorld.Y;
                if (!_dragMoved && Geom.Hypot(dx, dy) * Camera.Zoom > 2) _dragMoved = true;
                if (!_dragMoved) return;

                var byId = _dragOriginals.Where(p => p.Id is not null).ToDictionary(p => p.Id!);
                for (var i = 0; i < Paths.Count; i++)
                {
                    var id = Paths[i].Id;
                    if (id is null || !byId.TryGetValue(id, out var original)) continue;
                    Paths[i] = Geom.TransformPath(original, Geom.MatrixTranslate(dx, dy));
                }
                RequestRender();
                UpdateStatus();
                return;
            }
        }
    }

    private void OnPointerUp()
    {
        _canvas.ReleaseMouseCapture();
        if (_dragKind == DragKind.None) return;

        if (_dragKind == DragKind.Band)
        {
            FinishBand();
            return;
        }

        if (_dragKind == DragKind.Move)
        {
            var moved = _dragMoved;
            var snapshot = _pendingSnapshot;
            EndDrag();
            if (moved)
            {
                if (snapshot is not null) PushUndoSnapshot(snapshot);
                RegenerateAll(true);
            }
            return;
        }

        EndDrag();
    }

    private void EndDrag()
    {
        _dragKind = DragKind.None;
        _rubberBand = null;
        _pendingSnapshot = null;
        _dragMoved = false;
        UpdateCursor();
        RequestRender();
    }

    private void FinishBand()
    {
        if (_rubberBand is not { } band)
        {
            EndDrag();
            return;
        }

        var a = ViewMath.ScreenToWorld(Camera, new Vec(band.X, band.Y));
        var b = ViewMath.ScreenToWorld(Camera, new Vec(band.X + band.Width, band.Y + band.Height));
        var rect = new Bounds(
            Math.Min(a.X, b.X),
            Math.Min(a.Y, b.Y),
            Math.Max(a.X, b.X),
            Math.Max(a.Y, b.Y));

        if (!_bandAdditive) Selection.Clear();
        if (rect.MaxX - rect.MinX > 1e-6 || rect.MaxY - rect.MinY > 1e-6)
        {
            foreach (var path in Paths)
            {
                if (path.Id is null) continue;
                var bb = Geom.PolygonBounds(FlatPath(path));
                var intersects =
                    bb.MaxX >= rect.MinX && bb.MinX <= rect.MaxX &&
                    bb.MaxY >= rect.MinY && bb.MinY <= rect.MaxY;
                if (intersects) Selection.Add(path.Id);
            }
        }

        SelectedOperationId = null;
        EndDrag();
        UpdateSelectionUI();
        RequestRender();
    }

    private void UpdateCursor()
    {
        if (_dragKind == DragKind.Pan)
        {
            _canvas.Cursor = Cursors.ScrollAll;
            return;
        }
        _canvas.Cursor = _spaceDown || CurrentTool == Tool.Pan
            ? Cursors.Hand
            : CurrentTool == Tool.Pen
                ? Cursors.Cross
                : _hoverPathId is not null || _hoverOperationId is not null
                    ? Cursors.SizeAll
                    : Cursors.Arrow;
    }

    /* ------------------------------------------------------------------ */
    /* Pen tool                                                            */
    /* ------------------------------------------------------------------ */

    private void PenPointerDown(Vec world)
    {
        if (_penPoints.Count >= 3)
        {
            var first = _penPoints[0];
            if (Geom.Dist(world, first) * Camera.Zoom < 10)
            {
                FinishPen(true);
                return;
            }
        }

        if (_penPoints.Count > 0 && Geom.Dist(_penPoints[^1], world) < 1e-6) return;
        _penPoints.Add(world);
        _penCursor = world;
        UpdateHint("Click to add points. Click the first point to close, Enter to finish, Esc to cancel.");
        RequestRender();
    }

    private void FinishPen(bool closed)
    {
        if (_penPoints.Count < 2)
        {
            CancelPen();
            return;
        }

        var points = _penPoints.ToList();
        var segments = new List<Segment>();
        for (var i = 1; i < points.Count; i++)
        {
            segments.Add(new LineSegment(points[i - 1], points[i]));
        }
        if (closed) segments.Add(new LineSegment(points[^1], points[0]));

        PushUndo();
        var path = new Path
        {
            Segments = segments,
            Closed = closed,
            Id = NewPathId(),
            Name = "Pen path",
        };
        Paths.Add(path);
        Selection.Clear();
        Selection.Add(path.Id);
        SelectedOperationId = null;
        _penPoints.Clear();
        _penCursor = null;
        UpdateSelectionUI();
        UpdateEmptyState();
        UpdateHint("Path added.");
        RequestRender();
    }

    private void CancelPen()
    {
        _penPoints.Clear();
        _penCursor = null;
        UpdateHint("Pen cancelled.");
        RequestRender();
    }

    /* ------------------------------------------------------------------ */
    /* Navigation                                                          */
    /* ------------------------------------------------------------------ */

    private void ZoomAt(Vec screen, double factor)
    {
        var before = ViewMath.ScreenToWorld(Camera, screen);
        var zoom = Math.Min(400, Math.Max(0.05, Camera.Zoom * factor));
        if (Math.Abs(zoom - Camera.Zoom) < 1e-9) return;
        Camera = new View(
            screen.X - before.X * zoom,
            screen.Y + before.Y * zoom,
            zoom);
        UpdateStatus();
        RequestRender();
    }

    private void ZoomAtCenter(double factor)
    {
        ZoomAt(new Vec(_canvas.ActualWidth / 2, _canvas.ActualHeight / 2), factor);
    }

    public void Fit()
    {
        var width = Math.Max(1, _canvas.ActualWidth);
        var height = Math.Max(1, _canvas.ActualHeight);
        var bounds = Renderer.ContentBounds(Paths);
        if (bounds is null)
        {
            Camera = new View(width / 2, height / 2, 4);
        }
        else
        {
            var view = ViewMath.FitView(bounds.Value, width, height, 64);
            Camera = view with { Zoom = Math.Min(400, Math.Max(0.05, view.Zoom)) };
        }
        UpdateStatus();
        RequestRender();
    }

    /* ------------------------------------------------------------------ */
    /* Rendering                                                           */
    /* ------------------------------------------------------------------ */

    private void RequestRender()
    {
        _canvas.Options = new RenderOptions
        {
            Paths = Paths,
            Operations = Operations,
            Selection = Selection,
            SelectedOperationId = SelectedOperationId,
            View = Camera,
            Unit = DisplayUnit,
            Grid = ShowGrid,
            ShowToolpaths = ShowToolpaths,
            ShowToolDiameter = ShowToolDiameter,
            HoverPathId = _hoverPathId,
            RubberBand = _rubberBand,
            PenPreview = _penPoints.Count > 0 ? _penPoints : null,
            PenCursor = _penCursor,
            Tool = CurrentTool,
        };
    }

    private void UpdateEmptyState() =>
        _window.SetEmptyStateVisible(Paths.Count == 0 && !_emptyStateDismissed);

    private void UpdateStatus()
    {
        var zoomPercent = Math.Round(Camera.Zoom / PixelsPerMmAt100 * 100);
        var count = Selection.Count;
        _window.SetStatus(
            zoom: $"{zoomPercent:0}%",
            selection: $"{count} path{(count == 1 ? string.Empty : "s")} selected");
        UpdateStatusCoords(_lastWorld);
    }

    private void UpdateStatusCoords(Vec world)
    {
        var digits = DisplayUnit == Unit.In ? 3 : 2;
        _window.SetStatus(coords:
            $"X {ToDisplay(world.X).ToString("F" + digits.ToString(Inv), Inv)} " +
            $"Y {ToDisplay(world.Y).ToString("F" + digits.ToString(Inv), Inv)} {UnitLabel()}");
    }

    private void UpdateHint(string text) => _window.SetStatus(hint: text);

    private void UpdateSelectionUI()
    {
        UpdateStatus();
        RenderOperations();
        RequestRender();
    }

    /* ------------------------------------------------------------------ */
    /* Tools and toggles                                                   */
    /* ------------------------------------------------------------------ */

    public void SetTool(Tool tool)
    {
        if (CurrentTool == Tool.Pen && tool != Tool.Pen) CancelPen();
        CurrentTool = tool;
        _window.SetToolButtons(tool);
        UpdateCursor();
        UpdateHint(tool switch
        {
            Tool.Select => "Select paths. Shift-click to add; drag to move; drag empty space to marquee.",
            Tool.Pan => "Drag to pan. Wheel to zoom.",
            _ => "Click to draw. Click the first point to close, Enter to finish, Esc to cancel.",
        });
        RequestRender();
    }

    public void SetUnit(Unit unit)
    {
        DisplayUnit = unit;
        SavePrefs();
        UpdateStatus();
        RenderOperations();
        RequestRender();
        _window.ShowToast(
            $"Display units: {(unit == Unit.Mm ? "millimetres" : "inches")}",
            "info",
            2500);
    }

    private void ToggleGrid()
    {
        ShowGrid = !ShowGrid;
        _window.SetToggleStates(ShowGrid, ShowSnap, ShowToolpaths, ShowToolDiameter);
        SavePrefs();
        RequestRender();
    }

    private void ToggleSnap()
    {
        ShowSnap = !ShowSnap;
        _window.SetToggleStates(ShowGrid, ShowSnap, ShowToolpaths, ShowToolDiameter);
        SavePrefs();
        _window.ShowToast(ShowSnap ? "Snap to grid enabled" : "Snap to grid disabled", "info", 2000);
    }

    private void ToggleToolpaths()
    {
        ShowToolpaths = !ShowToolpaths;
        _window.SetToggleStates(ShowGrid, ShowSnap, ShowToolpaths, ShowToolDiameter);
        SavePrefs();
        RequestRender();
    }

    private void ToggleToolDiameter()
    {
        ShowToolDiameter = !ShowToolDiameter;
        _window.SetToggleStates(ShowGrid, ShowSnap, ShowToolpaths, ShowToolDiameter);
        SavePrefs();
        RequestRender();
    }

    /* ------------------------------------------------------------------ */
    /* Undo / redo                                                         */
    /* ------------------------------------------------------------------ */

    private Snapshot CaptureSnapshot() => new()
    {
        Paths = Paths.Select(p => p.Clone()).ToList(),
        Operations = Operations.Select(CloneOperation).ToList(),
        Selection = Selection.ToList(),
        SelectedOperationId = SelectedOperationId,
        PageWidthMm = _pageWidthMm,
        PageHeightMm = _pageHeightMm,
    };

    private static Operation CloneOperation(Operation op) => new()
    {
        Id = op.Id,
        Type = op.Type,
        Name = op.Name,
        Params = op.Params.Clone(),
        PathIds = op.PathIds.ToList(),
        Loops = op.Loops.Select(l => l.Clone()).ToList(),
        DrillPoints = op.DrillPoints.ToList(),
        Processed = op.Processed,
        Visible = op.Visible,
    };

    private void PushUndo() => PushUndoSnapshot(CaptureSnapshot());

    private void PushUndoSnapshot(Snapshot snapshot)
    {
        MarkDirty();
        _undoStack.Add(snapshot);
        if (_undoStack.Count > UndoLimit) _undoStack.RemoveAt(0);
        _redoStack.Clear();
    }

    private void Restore(Snapshot snapshot)
    {
        Paths = snapshot.Paths.Select(p => p.Clone()).ToList();
        Operations = snapshot.Operations.Select(CloneOperation).ToList();
        Selection = new HashSet<string>(snapshot.Selection);
        SelectedOperationId = snapshot.SelectedOperationId;
        _pageWidthMm = snapshot.PageWidthMm;
        _pageHeightMm = snapshot.PageHeightMm;
        _hoverPathId = null;
        _rubberBand = null;
        _flattenCache.Clear();
        UpdateSelectionUI();
        UpdateEmptyState();
        RequestRender();
    }

    private void Undo()
    {
        if (_undoStack.Count == 0)
        {
            _window.ShowToast("Nothing to undo", "info", 1800);
            return;
        }
        var snapshot = _undoStack[^1];
        _undoStack.RemoveAt(_undoStack.Count - 1);
        _redoStack.Add(CaptureSnapshot());
        Restore(snapshot);
        _revision = Math.Max(0, _revision - 1);
        UpdateTitle();
        _window.ShowToast("Undo", "info", 1200);
    }

    private void Redo()
    {
        if (_redoStack.Count == 0)
        {
            _window.ShowToast("Nothing to redo", "info", 1800);
            return;
        }
        var snapshot = _redoStack[^1];
        _redoStack.RemoveAt(_redoStack.Count - 1);
        _undoStack.Add(CaptureSnapshot());
        Restore(snapshot);
        _revision++;
        UpdateTitle();
        _window.ShowToast("Redo", "info", 1200);
    }

    /* ------------------------------------------------------------------ */
    /* Selection helpers                                                   */
    /* ------------------------------------------------------------------ */

    private void SelectAll()
    {
        Selection = new HashSet<string>(Paths.Where(p => p.Id is not null).Select(p => p.Id!));
        SelectedOperationId = null;
        UpdateSelectionUI();
    }

    private void CopySelection()
    {
        var selected = SelectedPaths();
        if (selected.Count == 0)
        {
            _window.ShowToast("Select one or more paths to copy", "info", 2200);
            return;
        }
        _clipboard = selected.Select(p => p.Clone()).ToList();
        _window.ShowToast(
            $"Copied {selected.Count} path{(selected.Count == 1 ? string.Empty : "s")}",
            "success",
            1800);
    }

    private void PasteSelection()
    {
        if (_clipboard.Count == 0)
        {
            _window.ShowToast("Clipboard is empty", "info", 1800);
            return;
        }
        PushUndo();
        var offset = Geom.MatrixTranslate(10, -10);
        Selection.Clear();
        foreach (var source in _clipboard)
        {
            var copy = Geom.TransformPath(source.Clone(), offset);
            copy.Id = NewPathId();
            copy.Name = source.Name is not null ? $"{source.Name} copy" : "Copy";
            Paths.Add(copy);
            Selection.Add(copy.Id);
        }
        SelectedOperationId = null;
        UpdateSelectionUI();
        UpdateEmptyState();
        _window.ShowToast(
            $"Pasted {_clipboard.Count} path{(_clipboard.Count == 1 ? string.Empty : "s")}",
            "success",
            1800);
    }

    private void DeleteSelection()
    {
        if (Selection.Count == 0) return;
        PushUndo();
        var ids = new HashSet<string>(Selection);
        Paths = Paths.Where(p => p.Id is null || !ids.Contains(p.Id)).ToList();

        var removedOps = new List<string>();
        var kept = new List<Operation>();
        foreach (var op in Operations)
        {
            op.PathIds = op.PathIds.Where(id => !ids.Contains(id)).ToList();
            if (op.PathIds.Count == 0) removedOps.Add(op.Id);
            else kept.Add(op);
        }
        Operations = kept;

        if (SelectedOperationId is not null && removedOps.Contains(SelectedOperationId))
        {
            SelectedOperationId = null;
        }
        Selection.Clear();
        RegenerateAll(true);
        UpdateSelectionUI();
        UpdateEmptyState();
        RequestRender();
    }

    /* ------------------------------------------------------------------ */
    /* IDs and path helpers                                                */
    /* ------------------------------------------------------------------ */

    private string NewPathId()
    {
        var id = $"p{_nextPathId++}";
        while (Paths.Any(p => p.Id == id)) id = $"p{_nextPathId++}";
        return id;
    }

    private string NewOperationId()
    {
        var id = $"op{_nextOperationId++}";
        while (Operations.Any(o => o.Id == id)) id = $"op{_nextOperationId++}";
        return id;
    }

    private void EnsurePathIds(IEnumerable<Path> paths)
    {
        var list = paths.ToList();
        foreach (var path in list)
        {
            if (string.IsNullOrEmpty(path.Id))
            {
                path.Id = NewPathId();
                continue;
            }
            var match = System.Text.RegularExpressions.Regex.Match(path.Id, @"^p(\d+)$");
            if (match.Success)
            {
                _nextPathId = Math.Max(_nextPathId, int.Parse(match.Groups[1].Value, Inv) + 1);
            }
        }

        var seen = new HashSet<string>();
        foreach (var path in list)
        {
            if (string.IsNullOrEmpty(path.Id) || !seen.Add(path.Id)) path.Id = NewPathId();
        }
    }

    private List<Path> SelectedPaths() =>
        Paths.Where(p => p.Id is not null && Selection.Contains(p.Id)).ToList();

    private List<Path> PathsForOperation(Operation op)
    {
        var ids = new HashSet<string>(op.PathIds);
        return Paths.Where(p => p.Id is not null && ids.Contains(p.Id)).ToList();
    }

    /* ------------------------------------------------------------------ */
    /* Operations                                                          */
    /* ------------------------------------------------------------------ */

    private List<string> RegenerateOperation(Operation op)
    {
        var paths = PathsForOperation(op);
        if (paths.Count == 0)
        {
            op.Loops = new List<Loop>();
            op.DrillPoints = new List<Vec>();
            op.Processed = false;
            return new List<string> { "The operation has no drawing paths left." };
        }

        var result = CamEngine.GenerateToolpath(op.Type, op.Params, paths, Tolerance);
        op.Loops = result.Loops;
        op.DrillPoints = result.DrillPoints;
        op.Processed = result.Loops.Count > 0 || result.DrillPoints.Count > 0;
        return result.Warnings;
    }

    public void RegenerateAll(bool silent = false)
    {
        var warnings = new List<string>();
        foreach (var op in Operations)
        {
            foreach (var warning in RegenerateOperation(op))
            {
                warnings.Add($"{op.Name}: {warning}");
            }
        }
        RenderOperations();
        RequestRender();
        if (!silent && warnings.Count > 0)
        {
            _window.ShowToast(string.Join(" ", warnings.Take(3)), "warning", 7000);
        }
    }

    private void AddOperationDialog()
    {
        if (Paths.Count == 0)
        {
            _window.ShowToast("Import a drawing first", "info", 2200);
            return;
        }

        var values = ShowDialog(new DialogOptions
        {
            Title = "Add toolpath",
            Description = "Choose the type of CAM operation to create for the selected paths.",
            Fields = new[]
            {
                new DialogField
                {
                    Key = "type",
                    Label = "Operation",
                    Type = FieldType.Select,
                    Value = "profile",
                    Options = new[]
                    {
                        new FieldOption("Profile (outside / inside)", "profile"),
                        new FieldOption("Pocket (clear the interior)", "pocket"),
                        new FieldOption("Follow path (cut on the line)", "follow"),
                        new FieldOption("Drill (holes / centers)", "drill"),
                        new FieldOption("Holes along a path", "drillpath"),
                    },
                },
                new DialogField
                {
                    Key = "note",
                    Type = FieldType.Label,
                    Wide = true,
                    Label = "Profile and pocket need closed paths. Follow path and holes along a path work with open or closed paths.",
                },
            },
            SubmitLabel = "Continue",
        });
        if (values is null) return;
        var type = Units.ParseOperationType(values["type"]?.ToString() ?? "profile");
        CreateOperation(type);
    }

    private void CreateOperation(OperationType type)
    {
        var selected = SelectedPaths();
        if (selected.Count == 0)
        {
            _window.ShowToast("Select one or more paths first", "warning", 2600);
            return;
        }

        var paths = selected;
        if (type is OperationType.Profile or OperationType.Pocket or OperationType.Drill)
        {
            paths = selected.Where(p => Geom.IsClosedPath(p)).ToList();
            if (paths.Count == 0)
            {
                _window.ShowToast("This operation needs at least one closed path", "warning", 3200);
                return;
            }
            if (paths.Count < selected.Count)
            {
                _window.ShowToast("Open paths were ignored for this operation", "info", 3000);
            }
        }

        var fields = OperationFields(type, null);
        var values = ShowDialog(new DialogOptions
        {
            Title = $"{TypeLabel[type]} operation",
            Description = OperationDescription(type),
            Fields = fields,
            SubmitLabel = "Create toolpath",
            Wide = true,
            Validate = v => ValidateOperation(type, v),
        });
        if (values is null) return;

        var parameters = ParamsFromValues(type, values);
        var fallbackName = $"{Units.ToCode(type)} {Operations.Count + 1}";
        var name = (values.GetValueOrDefault("name")?.ToString() ?? string.Empty).Trim();
        if (name.Length == 0) name = fallbackName;

        var op = new Operation
        {
            Id = NewOperationId(),
            Type = type,
            Name = name,
            Params = parameters,
            PathIds = paths.Where(p => p.Id is not null).Select(p => p.Id!).ToList(),
            Loops = new List<Loop>(),
            DrillPoints = new List<Vec>(),
            Processed = false,
            Visible = true,
        };

        PushUndo();
        var warnings = RegenerateOperation(op);
        Operations.Add(op);
        SelectedOperationId = op.Id;
        UpdateSelectionUI();
        UpdateEmptyState();

        if (!op.Processed)
        {
            _window.ShowToast(
                warnings.FirstOrDefault() ?? "No toolpath could be generated. Try different parameters.",
                "error",
                6000);
        }
        else if (warnings.Count > 0)
        {
            _window.ShowToast(
                $"{TypeLabel[type]} created with warnings: {string.Join(" ", warnings.Take(2))}",
                "warning",
                6000);
        }
        else
        {
            _window.ShowToast($"{TypeLabel[type]} created", "success", 3200);
        }
        RequestRender();
    }

    private static string OperationDescription(OperationType type) => type switch
    {
        OperationType.Profile =>
            "Cut around the selected closed paths, offset by the cutter radius.",
        OperationType.Pocket =>
            "Clear the interior with concentric offsets. Step-over is a percentage of the cutter diameter.",
        OperationType.Follow =>
            "Run the cutter directly along the selected paths (no offset).",
        OperationType.DrillPath =>
            "Place a fixed number of holes evenly along each selected path and peck-drill them to the target depth.",
        _ =>
            "Peck-drill at the centre of each closed path, or fill the shape with a hole pattern.",
    };

    private List<DialogField> OperationFields(OperationType type, Operation? op)
    {
        var p = op?.Params ?? OperationParams.Defaults(DisplayUnit);
        var u = UnitLabel();
        double Len(double mm) => Math.Round(ToDisplay(mm), 4, MidpointRounding.AwayFromZero);

        var fields = new List<DialogField>
        {
            new()
            {
                Key = "name",
                Label = "Name",
                Type = FieldType.Text,
                Value = op?.Name ?? $"{Units.ToCode(type)} {Operations.Count + 1}",
            },
            new()
            {
                Key = "toolDiameter",
                Label = "Tool diameter",
                Type = FieldType.Number,
                Value = Len(p.ToolDiameter),
                Min = 0.001,
                Step = 0.1,
                Suffix = u,
            },
            new()
            {
                Key = "targetDepth",
                Label = "Target depth",
                Type = FieldType.Number,
                Value = Len(p.TargetDepth),
                Step = 0.1,
                Suffix = u,
                Help = "Usually negative (below the stock surface).",
            },
        };

        if (type == OperationType.Profile)
        {
            fields.AddRange(new[]
            {
                new DialogField
                {
                    Key = "outside",
                    Label = "Offset side",
                    Type = FieldType.Select,
                    Value = p.Outside,
                    Options = new[]
                    {
                        new FieldOption("Outside", true),
                        new FieldOption("Inside", false),
                    },
                },
                new DialogField { Key = "safetyHeight", Label = "Safety height", Type = FieldType.Number, Value = Len(p.SafetyHeight), Step = 0.1, Suffix = u },
                new DialogField { Key = "stockSurface", Label = "Stock surface", Type = FieldType.Number, Value = Len(p.StockSurface), Step = 0.1, Suffix = u },
                new DialogField { Key = "stepdown", Label = "Step down", Type = FieldType.Number, Value = Len(p.Stepdown), Min = 0.001, Step = 0.1, Suffix = u },
                new DialogField { Key = "feedrate", Label = "Feed rate", Type = FieldType.Number, Value = Len(p.Feedrate), Min = 0.001, Step = 10, Suffix = $"{u}/min" },
                new DialogField { Key = "plungerate", Label = "Plunge rate", Type = FieldType.Number, Value = Len(p.PlungeRate), Min = 0.001, Step = 10, Suffix = $"{u}/min" },
                DirectionField(p.Direction),
                new DialogField { Key = "tabSpacing", Label = "Tab spacing (0 = off)", Type = FieldType.Number, Value = Len(p.TabSpacing), Min = 0, Step = 1, Suffix = u },
                new DialogField { Key = "tabWidth", Label = "Tab width", Type = FieldType.Number, Value = Len(p.TabWidth), Min = 0, Step = 0.1, Suffix = u },
                new DialogField { Key = "tabHeight", Label = "Tab height", Type = FieldType.Number, Value = Len(p.TabHeight), Min = 0, Step = 0.1, Suffix = u },
            });
        }
        else if (type == OperationType.Pocket)
        {
            fields.AddRange(new[]
            {
                new DialogField { Key = "safetyHeight", Label = "Safety height", Type = FieldType.Number, Value = Len(p.SafetyHeight), Step = 0.1, Suffix = u },
                new DialogField { Key = "stockSurface", Label = "Stock surface", Type = FieldType.Number, Value = Len(p.StockSurface), Step = 0.1, Suffix = u },
                new DialogField { Key = "stepover", Label = "Step over (%)", Type = FieldType.Number, Value = Math.Round(p.Stepover * 100, 2, MidpointRounding.AwayFromZero), Min = 1, Max = 100, Step = 1, Suffix = "%" },
                new DialogField { Key = "stepdown", Label = "Step down", Type = FieldType.Number, Value = Len(p.Stepdown), Min = 0.001, Step = 0.1, Suffix = u },
                new DialogField { Key = "roughingClearance", Label = "Roughing clearance", Type = FieldType.Number, Value = Len(p.RoughingClearance), Min = 0, Step = 0.1, Suffix = u },
                new DialogField { Key = "feedrate", Label = "Feed rate", Type = FieldType.Number, Value = Len(p.Feedrate), Min = 0.001, Step = 10, Suffix = $"{u}/min" },
                new DialogField { Key = "plungerate", Label = "Plunge rate", Type = FieldType.Number, Value = Len(p.PlungeRate), Min = 0.001, Step = 10, Suffix = $"{u}/min" },
                DirectionField(p.Direction),
            });
        }
        else if (type == OperationType.Follow)
        {
            fields.AddRange(new[]
            {
                new DialogField { Key = "safetyHeight", Label = "Safety height", Type = FieldType.Number, Value = Len(p.SafetyHeight), Step = 0.1, Suffix = u },
                new DialogField { Key = "stockSurface", Label = "Stock surface", Type = FieldType.Number, Value = Len(p.StockSurface), Step = 0.1, Suffix = u },
                new DialogField { Key = "stepdown", Label = "Step down", Type = FieldType.Number, Value = Len(p.Stepdown), Min = 0.001, Step = 0.1, Suffix = u },
                new DialogField { Key = "feedrate", Label = "Feed rate", Type = FieldType.Number, Value = Len(p.Feedrate), Min = 0.001, Step = 10, Suffix = $"{u}/min" },
                new DialogField { Key = "plungerate", Label = "Plunge rate", Type = FieldType.Number, Value = Len(p.PlungeRate), Min = 0.001, Step = 10, Suffix = $"{u}/min" },
            });
        }
        else if (type == OperationType.DrillPath)
        {
            fields.AddRange(new[]
            {
                new DialogField
                {
                    Key = "holeCount",
                    Label = "Number of holes",
                    Type = FieldType.Number,
                    Value = Math.Max(1, p.HoleCount),
                    Min = 1,
                    Step = 1,
                    Help = "Holes are spaced evenly along each selected path.",
                },
                new DialogField { Key = "safetyHeight", Label = "Safety height", Type = FieldType.Number, Value = Len(p.SafetyHeight), Step = 0.1, Suffix = u },
                new DialogField { Key = "stockSurface", Label = "Stock surface", Type = FieldType.Number, Value = Len(p.StockSurface), Step = 0.1, Suffix = u },
                new DialogField { Key = "stepdown", Label = "Peck distance", Type = FieldType.Number, Value = Len(p.Stepdown), Min = 0.001, Step = 0.1, Suffix = u },
                new DialogField { Key = "plungerate", Label = "Plunge rate", Type = FieldType.Number, Value = Len(p.PlungeRate), Min = 0.001, Step = 10, Suffix = $"{u}/min" },
            });
        }
        else
        {
            fields.AddRange(new[]
            {
                new DialogField
                {
                    Key = "center",
                    Label = "Drill location",
                    Type = FieldType.Select,
                    Value = p.Center,
                    Options = new[]
                    {
                        new FieldOption("Path centre", true),
                        new FieldOption("Fill pattern", false),
                    },
                },
                new DialogField { Key = "spacing", Label = "Hole spacing", Type = FieldType.Number, Value = Len(p.Spacing), Min = 0.001, Step = 0.5, Suffix = u },
                new DialogField { Key = "safetyHeight", Label = "Safety height", Type = FieldType.Number, Value = Len(p.SafetyHeight), Step = 0.1, Suffix = u },
                new DialogField { Key = "stockSurface", Label = "Stock surface", Type = FieldType.Number, Value = Len(p.StockSurface), Step = 0.1, Suffix = u },
                new DialogField { Key = "stepdown", Label = "Peck distance", Type = FieldType.Number, Value = Len(p.Stepdown), Min = 0.001, Step = 0.1, Suffix = u },
                new DialogField { Key = "plungerate", Label = "Plunge rate", Type = FieldType.Number, Value = Len(p.PlungeRate), Min = 0.001, Step = 10, Suffix = $"{u}/min" },
            });
        }

        return fields;
    }

    private static DialogField DirectionField(Direction direction) => new()
    {
        Key = "direction",
        Label = "Direction",
        Type = FieldType.Select,
        Value = (int)direction,
        Options = new[]
        {
            new FieldOption("Counter-clockwise (climb)", 1),
            new FieldOption("Clockwise (conventional)", 2),
        },
    };

    private static double Number(Dictionary<string, object?> values, string key, double fallback = double.NaN)
    {
        var raw = values.GetValueOrDefault(key);
        return raw switch
        {
            double d => d,
            int i => i,
            float f => f,
            string s when double.TryParse(s, NumberStyles.Float, Inv, out var parsed) => parsed,
            _ => fallback,
        };
    }

    private static bool Bool(Dictionary<string, object?> values, string key, bool fallback = false) =>
        values.GetValueOrDefault(key) is bool b ? b : fallback;

    private static string? ValidateOperation(OperationType type, Dictionary<string, object?> v)
    {
        if ((v.GetValueOrDefault("name")?.ToString() ?? string.Empty).Trim().Length == 0)
            return "Give the operation a name.";

        var tool = Number(v, "toolDiameter");
        if (!double.IsFinite(tool) || tool <= 0) return "Tool diameter must be greater than zero.";

        var target = Number(v, "targetDepth");
        var stock = Number(v, "stockSurface");
        if (!double.IsFinite(stock)) stock = 0;
        if (!double.IsFinite(target)) return "Target depth must be a number.";
        if (target >= stock) return "Target depth must be below the stock surface.";

        var safety = Number(v, "safetyHeight");
        if (!double.IsFinite(safety) || safety < target) return "Safety height must be above the target depth.";

        var stepdown = Number(v, "stepdown");
        if (!double.IsFinite(stepdown) || stepdown <= 0) return "Step down must be greater than zero.";

        var plunge = Number(v, "plungerate");
        if (!double.IsFinite(plunge) || plunge <= 0) return "Plunge rate must be greater than zero.";

        if (type != OperationType.Drill && type != OperationType.DrillPath)
        {
            var feed = Number(v, "feedrate");
            if (!double.IsFinite(feed) || feed <= 0) return "Feed rate must be greater than zero.";
        }

        if (type == OperationType.Pocket)
        {
            var stepover = Number(v, "stepover");
            if (!double.IsFinite(stepover) || stepover <= 0 || stepover > 100)
                return "Step over must be between 1 and 100%.";
            if (Number(v, "roughingClearance") < 0) return "Roughing clearance cannot be negative.";
        }

        if (type == OperationType.Drill && !Bool(v, "center", true))
        {
            var spacing = Number(v, "spacing");
            if (!double.IsFinite(spacing) || spacing <= 0) return "Hole spacing must be greater than zero.";
        }

        if (type == OperationType.DrillPath)
        {
            var holes = Number(v, "holeCount");
            if (!double.IsFinite(holes) || holes < 1 || Math.Round(holes) != holes)
                return "Number of holes must be a whole number of at least 1.";
        }

        if (type == OperationType.Profile)
        {
            var ts = Number(v, "tabSpacing");
            var tw = Number(v, "tabWidth");
            var th = Number(v, "tabHeight");
            var any = ts > 0 || tw > 0 || th > 0;
            if (any && (ts <= 0 || tw <= 0 || th <= 0))
                return "For tabs, set spacing, width and height (or set all to 0).";
            if (any && ts <= tw) return "Tab spacing must be greater than the tab width.";
        }

        return null;
    }

    private OperationParams ParamsFromValues(OperationType type, Dictionary<string, object?> v)
    {
        var defaults = OperationParams.Defaults(DisplayUnit);
        double N(string key, double fallback)
        {
            var value = Number(v, key);
            return double.IsFinite(value) ? value : fallback;
        }

        defaults.ToolDiameter = FromDisplay(N("toolDiameter", ToDisplay(defaults.ToolDiameter)));
        defaults.TargetDepth = FromDisplay(N("targetDepth", ToDisplay(defaults.TargetDepth)));
        defaults.SafetyHeight = FromDisplay(N("safetyHeight", ToDisplay(defaults.SafetyHeight)));
        defaults.StockSurface = FromDisplay(N("stockSurface", ToDisplay(defaults.StockSurface)));
        defaults.Stepdown = FromDisplay(N("stepdown", ToDisplay(defaults.Stepdown)));
        defaults.Feedrate = FromDisplay(N("feedrate", ToDisplay(defaults.Feedrate)));
        defaults.PlungeRate = FromDisplay(N("plungerate", ToDisplay(defaults.PlungeRate)));

        if (type == OperationType.Profile)
        {
            defaults.Outside = Bool(v, "outside", true);
            defaults.Direction = Number(v, "direction", 1) == 2
                ? Direction.Clockwise
                : Direction.CounterClockwise;
            defaults.TabSpacing = FromDisplay(Math.Max(0, N("tabSpacing", 0)));
            defaults.TabWidth = FromDisplay(Math.Max(0, N("tabWidth", 0)));
            defaults.TabHeight = FromDisplay(Math.Max(0, N("tabHeight", 0)));
        }
        else if (type == OperationType.Pocket)
        {
            defaults.Stepover = Math.Max(0.01, Math.Min(1, N("stepover", 40) / 100));
            defaults.RoughingClearance = FromDisplay(Math.Max(0, N("roughingClearance", 0)));
            defaults.Direction = Number(v, "direction", 1) == 2
                ? Direction.Clockwise
                : Direction.CounterClockwise;
        }
        else if (type == OperationType.Drill)
        {
            defaults.Center = Bool(v, "center", true);
            defaults.Spacing = FromDisplay(Math.Max(0.001, N("spacing", 1)));
        }
        else if (type == OperationType.DrillPath)
        {
            defaults.HoleCount = Math.Max(1, (int)Math.Round(N("holeCount", 4), MidpointRounding.AwayFromZero));
        }

        return defaults;
    }

    private void EditOperation(Operation op)
    {
        var values = ShowDialog(new DialogOptions
        {
            Title = $"Edit {TypeLabel[op.Type].ToLowerInvariant()}",
            Description = op.Name,
            Fields = OperationFields(op.Type, op),
            SubmitLabel = "Save and regenerate",
            Wide = true,
            Validate = v => ValidateOperation(op.Type, v),
        });
        if (values is null) return;

        PushUndo();
        var name = (values.GetValueOrDefault("name")?.ToString() ?? op.Name).Trim();
        if (name.Length > 0) op.Name = name;
        op.Params = ParamsFromValues(op.Type, values);
        var warnings = RegenerateOperation(op);
        SelectedOperationId = op.Id;
        UpdateSelectionUI();
        if (!op.Processed)
        {
            _window.ShowToast(warnings.FirstOrDefault() ?? "No toolpath generated", "error", 5000);
        }
        else
        {
            _window.ShowToast(
                "Toolpath updated",
                warnings.Count > 0 ? "warning" : "success",
                2500);
        }
    }

    private void DeleteOperation(Operation op)
    {
        PushUndo();
        Operations = Operations.Where(o => o.Id != op.Id).ToList();
        if (SelectedOperationId == op.Id) SelectedOperationId = null;
        UpdateSelectionUI();
        _window.ShowToast("Operation deleted", "info", 1800);
    }

    private void MoveOperation(Operation op, int delta)
    {
        var index = Operations.FindIndex(o => o.Id == op.Id);
        var target = index + delta;
        if (index < 0 || target < 0 || target >= Operations.Count) return;
        PushUndo();
        (Operations[index], Operations[target]) = (Operations[target], Operations[index]);
        SelectedOperationId = op.Id;
        RenderOperations();
        RequestRender();
        _window.ShowToast("Operation order updated (G-code follows this list)", "info", 2200);
    }

    private void AddTabsDialog()
    {
        var op = Operations.FirstOrDefault(o => o.Id == SelectedOperationId && o.Type == OperationType.Profile);
        if (op is null)
        {
            _window.ShowToast("Select a profile operation first", "warning", 3000);
            return;
        }

        var u = UnitLabel();
        var values = ShowDialog(new DialogOptions
        {
            Title = "Add tabs",
            Description = "Tabs leave small uncut bridges so the part does not come loose. Set spacing, width and height.",
            Fields = new[]
            {
                new DialogField { Key = "tabSpacing", Label = "Tab spacing", Type = FieldType.Number, Value = Math.Round(ToDisplay(op.Params.TabSpacing), 3, MidpointRounding.AwayFromZero), Min = 0.001, Step = 1, Suffix = u },
                new DialogField { Key = "tabWidth", Label = "Tab width", Type = FieldType.Number, Value = Math.Round(ToDisplay(op.Params.TabWidth), 3, MidpointRounding.AwayFromZero), Min = 0.001, Step = 0.1, Suffix = u },
                new DialogField { Key = "tabHeight", Label = "Tab height", Type = FieldType.Number, Value = Math.Round(ToDisplay(op.Params.TabHeight), 3, MidpointRounding.AwayFromZero), Min = 0.001, Step = 0.1, Suffix = u },
            },
            SubmitLabel = "Apply tabs",
            Validate = v =>
            {
                var ts = Number(v, "tabSpacing");
                var tw = Number(v, "tabWidth");
                var th = Number(v, "tabHeight");
                if (!(ts > 0 && tw > 0 && th > 0)) return "All tab values must be greater than zero.";
                if (ts <= tw) return "Tab spacing must be greater than the tab width.";
                return null;
            },
        });
        if (values is null) return;

        PushUndo();
        op.Params.TabSpacing = FromDisplay(Number(values, "tabSpacing"));
        op.Params.TabWidth = FromDisplay(Number(values, "tabWidth"));
        op.Params.TabHeight = FromDisplay(Number(values, "tabHeight"));
        RegenerateOperation(op);
        SelectedOperationId = op.Id;
        UpdateSelectionUI();
        RequestRender();
        _window.ShowToast("Tabs applied", "success", 2000);
    }

    /* ------------------------------------------------------------------ */
    /* Operations panel                                                    */
    /* ------------------------------------------------------------------ */

    private void RenderOperations()
    {
        var list = _window.OperationList;
        list.Children.Clear();

        var count = Operations.Count;
        _window.SetOperationCount(count == 0
            ? "No operations yet"
            : $"{count} operation{(count == 1 ? string.Empty : "s")}");
        _window.SetExportEnabled(Operations.Any(o => o.Processed));

        if (count == 0)
        {
            var empty = new StackPanel { Margin = new Thickness(6, 12, 6, 0) };
            empty.Children.Add(new TextBlock
            {
                Text = "No CAM operations yet.",
                Foreground = ResourceBrush("TextBrush"),
                TextWrapping = TextWrapping.Wrap,
            });
            empty.Children.Add(new TextBlock
            {
                Text = "Select one or more paths and choose CAM → Profile, Pocket, Drill or Holes along path.",
                Foreground = ResourceBrush("MutedBrush"),
                TextWrapping = TextWrapping.Wrap,
                Margin = new Thickness(0, 6, 0, 0),
            });
            list.Children.Add(empty);
            return;
        }

        foreach (var op in Operations) list.Children.Add(BuildOperationItem(op));
    }

    private static SolidColorBrush ResourceBrush(string key) => (SolidColorBrush)Application.Current.Resources[key];

    private Border BuildOperationItem(Operation op)
    {
        var selected = op.Id == SelectedOperationId;
        var accent = ResourceBrush("AccentBrush");
        var soft = ResourceBrush("AccentSoft");
        var borderSoft = ResourceBrush("BorderBrushSoft");
        var muted = ResourceBrush("MutedBrush");

        var card = new Border
        {
            Background = selected ? soft : Brushes.Transparent,
            BorderBrush = selected ? accent : borderSoft,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(7),
            Padding = new Thickness(7, 7, 6, 7),
            Margin = new Thickness(0, 0, 0, 6),
            Cursor = Cursors.Hand,
        };

        var grid = new Grid();
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

        var visibility = new CheckBox
        {
            IsChecked = op.Visible,
            ToolTip = "Show / hide toolpath",
            VerticalAlignment = VerticalAlignment.Center,
            Focusable = false,
        };
        visibility.Click += (_, e) =>
        {
            op.Visible = visibility.IsChecked == true;
            RequestRender();
            RenderOperations();
            e.Handled = true;
        };
        grid.Children.Add(visibility);

        var swatch = new Border
        {
            Width = 11,
            Height = 11,
            CornerRadius = new CornerRadius(3),
            Background = new SolidColorBrush(TypeColor[op.Type]),
            VerticalAlignment = VerticalAlignment.Center,
            Margin = new Thickness(6, 2, 7, 0),
        };
        Grid.SetColumn(swatch, 1);
        grid.Children.Add(swatch);

        var main = new StackPanel { VerticalAlignment = VerticalAlignment.Center };
        main.Children.Add(new TextBlock
        {
            Text = op.Name,
            FontWeight = FontWeights.SemiBold,
            TextTrimming = TextTrimming.CharacterEllipsis,
        });

        var meta = new WrapPanel { Margin = new Thickness(0, 3, 0, 0) };
        void Meta(string text, Brush? brush = null)
        {
            meta.Children.Add(new TextBlock
            {
                Text = text,
                FontSize = 11.5,
                Foreground = brush ?? muted,
                Margin = new Thickness(0, 0, 8, 0),
            });
        }

        Meta(TypeLabel[op.Type]);
        Meta($"Ø {FmtLen(op.Params.ToolDiameter)} {UnitLabel()}");
        Meta($"depth {FmtLen(op.Params.TargetDepth)} {UnitLabel()}");
        if ((op.Type == OperationType.Drill || op.Type == OperationType.DrillPath) && op.Processed)
        {
            Meta($"{op.DrillPoints.Count} hole{(op.DrillPoints.Count == 1 ? string.Empty : "s")}");
        }
        else if (op.Processed)
        {
            Meta($"{op.Loops.Count} loop{(op.Loops.Count == 1 ? string.Empty : "s")}");
        }
        if (!op.Processed)
        {
            meta.Children.Add(new Border
            {
                Background = new SolidColorBrush(Color.FromRgb(0xfd, 0xf1, 0xdd)),
                CornerRadius = new CornerRadius(4),
                Padding = new Thickness(5, 1, 5, 1),
                Margin = new Thickness(0, 0, 6, 0),
                Child = new TextBlock
                {
                    Text = "no toolpath",
                    FontSize = 10.5,
                    Foreground = ResourceBrush("WarningBrush"),
                },
            });
        }
        if (!op.Visible)
        {
            meta.Children.Add(new Border
            {
                Background = new SolidColorBrush(Color.FromRgb(0xef, 0xef, 0xe8)),
                CornerRadius = new CornerRadius(4),
                Padding = new Thickness(5, 1, 5, 1),
                Margin = new Thickness(0, 0, 6, 0),
                Child = new TextBlock
                {
                    Text = "hidden",
                    FontSize = 10.5,
                    Foreground = muted,
                },
            });
        }
        main.Children.Add(meta);
        Grid.SetColumn(main, 2);
        grid.Children.Add(main);

        var actions = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            VerticalAlignment = VerticalAlignment.Center,
        };
        var index = Operations.IndexOf(op);

        Button Action(string text, string tip, Action action, bool enabled = true)
        {
            var button = new Button
            {
                Content = text,
                ToolTip = tip,
                Style = (Style)Application.Current.Resources["SmallButton"],
                IsEnabled = enabled,
                Focusable = false,
            };
            button.Click += (_, e) =>
            {
                e.Handled = true;
                action();
            };
            return button;
        }

        actions.Children.Add(Action("↑", "Move earlier in the machining order", () => MoveOperation(op, -1), index > 0));
        actions.Children.Add(Action("↓", "Move later in the machining order", () => MoveOperation(op, 1), index < Operations.Count - 1));
        actions.Children.Add(Action("✎", "Edit", () => EditOperation(op)));
        actions.Children.Add(Action("✕", "Delete", () =>
        {
            if (DialogService.Confirm(_window, $"Delete \"{op.Name}\"?", "Delete operation")) DeleteOperation(op);
        }));
        Grid.SetColumn(actions, 3);
        grid.Children.Add(actions);

        card.Child = grid;
        card.MouseLeftButtonDown += (_, e) =>
        {
            if (e.ClickCount == 2)
            {
                EditOperation(op);
                e.Handled = true;
                return;
            }
            SelectedOperationId = op.Id;
            UpdateSelectionUI();
            RenderOperations();
            e.Handled = true;
        };

        return card;
    }

    /* ------------------------------------------------------------------ */
    /* Insert shapes                                                       */
    /* ------------------------------------------------------------------ */

    private Vec ViewCenterWorld() => ViewMath.ScreenToWorld(
        Camera,
        new Vec(_canvas.ActualWidth / 2, _canvas.ActualHeight / 2));

    private void InsertShapeDialog()
    {
        var values = ShowDialog(new DialogOptions
        {
            Title = "Insert shape",
            Description = "The shape is placed at the centre of the current view.",
            Fields = new[]
            {
                new DialogField
                {
                    Key = "shape",
                    Label = "Shape",
                    Type = FieldType.Select,
                    Value = "circle",
                    Options = new[]
                    {
                        new FieldOption("Circle", "circle"),
                        new FieldOption("Ellipse", "ellipse"),
                        new FieldOption("Rectangle", "rectangle"),
                        new FieldOption("Rounded rectangle", "roundedrect"),
                        new FieldOption("Polygon", "polygon"),
                        new FieldOption("Star", "star"),
                    },
                },
            },
            SubmitLabel = "Continue",
        });
        if (values is null) return;
        InsertShape(values["shape"]?.ToString() ?? "circle");
    }

    private void InsertShape(string shape)
    {
        var u = UnitLabel();
        double Mm(double value) => FromDisplay(value);
        List<DialogField> fields = shape switch
        {
            "circle" => new()
            {
                new DialogField { Key = "diameter", Label = "Diameter", Type = FieldType.Number, Value = ToDisplay(25.4), Min = 0.001, Step = 1, Suffix = u },
            },
            "ellipse" => new()
            {
                new DialogField { Key = "width", Label = "Width", Type = FieldType.Number, Value = ToDisplay(50.8), Min = 0.001, Step = 1, Suffix = u },
                new DialogField { Key = "height", Label = "Height", Type = FieldType.Number, Value = ToDisplay(25.4), Min = 0.001, Step = 1, Suffix = u },
            },
            "rectangle" => new()
            {
                new DialogField { Key = "width", Label = "Width", Type = FieldType.Number, Value = ToDisplay(50.8), Min = 0.001, Step = 1, Suffix = u },
                new DialogField { Key = "height", Label = "Height", Type = FieldType.Number, Value = ToDisplay(38.1), Min = 0.001, Step = 1, Suffix = u },
            },
            "roundedrect" => new()
            {
                new DialogField { Key = "width", Label = "Width", Type = FieldType.Number, Value = ToDisplay(50.8), Min = 0.001, Step = 1, Suffix = u },
                new DialogField { Key = "height", Label = "Height", Type = FieldType.Number, Value = ToDisplay(38.1), Min = 0.001, Step = 1, Suffix = u },
                new DialogField { Key = "radius", Label = "Corner radius", Type = FieldType.Number, Value = ToDisplay(5), Min = 0, Step = 0.5, Suffix = u },
            },
            "polygon" => new()
            {
                new DialogField { Key = "sides", Label = "Number of sides", Type = FieldType.Number, Value = 6, Min = 3, Step = 1 },
                new DialogField { Key = "radius", Label = "Radius", Type = FieldType.Number, Value = ToDisplay(25.4), Min = 0.001, Step = 1, Suffix = u },
            },
            _ => new()
            {
                new DialogField { Key = "points", Label = "Number of points", Type = FieldType.Number, Value = 6, Min = 3, Step = 1 },
                new DialogField { Key = "radius", Label = "Outer radius", Type = FieldType.Number, Value = ToDisplay(25.4), Min = 0.001, Step = 1, Suffix = u },
                new DialogField { Key = "pointiness", Label = "Pointiness (%)", Type = FieldType.Number, Value = 50, Min = 1, Max = 99, Step = 1, Suffix = "%" },
            },
        };

        var values = ShowDialog(new DialogOptions
        {
            Title = $"Insert {(shape == "roundedrect" ? "rounded rectangle" : shape)}",
            Fields = fields,
            SubmitLabel = "Insert",
            Validate = v =>
            {
                foreach (var field in fields)
                {
                    if (field.Type != FieldType.Number) continue;
                    var n = Number(v, field.Key);
                    if (!double.IsFinite(n)) return $"{field.Label} must be a number.";
                    if (field.Min is { } min && n < min) return $"{field.Label} is too small.";
                    if (field.Max is { } max && n > max) return $"{field.Label} is too large.";
                }
                return null;
            },
        });
        if (values is null) return;

        var c = ViewCenterWorld();
        double N(string key) => Number(values, key);
        Path path;
        var label = shape;

        switch (shape)
        {
            case "circle":
            {
                var r = Mm(N("diameter")) / 2;
                path = Shapes.EllipsePath(c.X, c.Y, r, r);
                label = "Circle";
                break;
            }
            case "ellipse":
                path = Shapes.EllipsePath(c.X, c.Y, Mm(N("width")) / 2, Mm(N("height")) / 2);
                label = "Ellipse";
                break;
            case "rectangle":
            {
                var w = Mm(N("width"));
                var h = Mm(N("height"));
                path = Shapes.RectPath(c.X - w / 2, c.Y - h / 2, w, h);
                label = "Rectangle";
                break;
            }
            case "roundedrect":
            {
                var w = Mm(N("width"));
                var h = Mm(N("height"));
                path = Shapes.RoundedRectPath(c.X - w / 2, c.Y - h / 2, w, h, Mm(N("radius")));
                label = "Rounded rectangle";
                break;
            }
            case "polygon":
                path = Shapes.PolygonPath(c.X, c.Y, Mm(N("radius")), (int)N("sides"), Math.PI / 2);
                label = "Polygon";
                break;
            default:
                path = Shapes.StarPath(c.X, c.Y, Mm(N("radius")), (int)N("points"), N("pointiness"));
                label = "Star";
                break;
        }

        PushUndo();
        path.Id = NewPathId();
        path.Name = label;
        Paths.Add(path);
        Selection.Clear();
        Selection.Add(path.Id);
        SelectedOperationId = null;
        UpdateSelectionUI();
        UpdateEmptyState();
        RequestRender();
    }

    /* ------------------------------------------------------------------ */
    /* Transformations                                                     */
    /* ------------------------------------------------------------------ */

    private Vec? SelectionCenter()
    {
        var selected = SelectedPaths();
        if (selected.Count == 0) return null;
        Bounds? bounds = null;
        foreach (var path in selected)
        {
            var pb = Geom.PolygonBounds(Geom.FlattenPath(path, 0.2));
            bounds = bounds is { } current ? Geom.UnionBounds(current, pb) : pb;
        }
        if (bounds is not { } b) return null;
        return new Vec((b.MinX + b.MaxX) / 2, (b.MinY + b.MaxY) / 2);
    }

    private void ApplyTransformToSelection(CoreMatrix matrix, string label)
    {
        var selected = SelectedPaths();
        if (selected.Count == 0)
        {
            _window.ShowToast("Select one or more paths first", "info", 2200);
            return;
        }
        PushUndo();
        var ids = new HashSet<string>(selected.Select(p => p.Id!));
        Paths = Paths.Select(p =>
            p.Id is not null && ids.Contains(p.Id) ? Geom.TransformPath(p, matrix) : p).ToList();
        _flattenCache.Clear();
        RegenerateAll(true);
        UpdateSelectionUI();
        RequestRender();
        _window.ShowToast(label, "success", 1800);
    }

    private void ScaleDialog()
    {
        var center = SelectionCenter();
        if (center is null)
        {
            _window.ShowToast("Select one or more paths first", "info", 2200);
            return;
        }
        var values = ShowDialog(new DialogOptions
        {
            Title = "Scale selection",
            Fields = new[]
            {
                new DialogField { Key = "sx", Label = "Scale X (%)", Type = FieldType.Number, Value = 100.0, Step = 1, Suffix = "%" },
                new DialogField { Key = "sy", Label = "Scale Y (%)", Type = FieldType.Number, Value = 100.0, Step = 1, Suffix = "%" },
            },
            SubmitLabel = "Scale",
            Validate = v =>
            {
                var sx = Number(v, "sx");
                var sy = Number(v, "sy");
                return !double.IsFinite(sx) || !double.IsFinite(sy) || sx == 0 || sy == 0
                    ? "Scale values must be non-zero numbers."
                    : null;
            },
        });
        if (values is null) return;

        var sxScale = Number(values, "sx") / 100;
        var syScale = Number(values, "sy") / 100;
        var c = center.Value;
        var m = Geom.MatrixMultiply(
            Geom.MatrixMultiply(
                Geom.MatrixTranslate(c.X, c.Y),
                Geom.MatrixScale(sxScale, syScale)),
            Geom.MatrixTranslate(-c.X, -c.Y));
        ApplyTransformToSelection(m, "Selection scaled");
    }

    private void RotateDialog()
    {
        var center = SelectionCenter();
        if (center is null)
        {
            _window.ShowToast("Select one or more paths first", "info", 2200);
            return;
        }
        var values = ShowDialog(new DialogOptions
        {
            Title = "Rotate selection",
            Fields = new[]
            {
                new DialogField { Key = "angle", Label = "Angle", Type = FieldType.Number, Value = 0.0, Step = 1, Suffix = "°" },
            },
            SubmitLabel = "Rotate",
            Validate = v => double.IsFinite(Number(v, "angle")) ? null : "Enter an angle in degrees.",
        });
        if (values is null) return;

        var angle = Number(values, "angle");
        if (angle == 0) return;
        var c = center.Value;
        var m = Geom.MatrixMultiply(
            Geom.MatrixMultiply(
                Geom.MatrixTranslate(c.X, c.Y),
                Geom.MatrixRotate(angle * Math.PI / 180)),
            Geom.MatrixTranslate(-c.X, -c.Y));
        ApplyTransformToSelection(m, "Selection rotated");
    }

    private void SkewDialog()
    {
        var center = SelectionCenter();
        if (center is null)
        {
            _window.ShowToast("Select one or more paths first", "info", 2200);
            return;
        }
        var values = ShowDialog(new DialogOptions
        {
            Title = "Skew selection",
            Fields = new[]
            {
                new DialogField { Key = "skx", Label = "Skew X (%)", Type = FieldType.Number, Value = 0.0, Step = 1, Suffix = "%" },
                new DialogField { Key = "sky", Label = "Skew Y (%)", Type = FieldType.Number, Value = 0.0, Step = 1, Suffix = "%" },
            },
            SubmitLabel = "Skew",
        });
        if (values is null) return;

        var skx = Number(values, "skx");
        var sky = Number(values, "sky");
        if (!double.IsFinite(skx)) skx = 0;
        if (!double.IsFinite(sky)) sky = 0;
        if (skx == 0 && sky == 0) return;

        var skew = new CoreMatrix(1, Math.Tan(-sky / 100), Math.Tan(-skx / 100), 1, 0, 0);
        var c = center.Value;
        var m = Geom.MatrixMultiply(
            Geom.MatrixMultiply(Geom.MatrixTranslate(c.X, c.Y), skew),
            Geom.MatrixTranslate(-c.X, -c.Y));
        ApplyTransformToSelection(m, "Selection skewed");
    }

    private void RepairOpenPathsDialog()
    {
        var selection = SelectedPaths();
        var scope = selection.Count > 0 ? selection : Paths;
        var open = scope.Where(p => p.Segments.Count > 0 && !Geom.IsClosedPath(p)).ToList();
        if (open.Count == 0)
        {
            _window.ShowToast(
                selection.Count > 0
                    ? "The selected paths are already closed."
                    : "There are no open paths to repair.",
                "info",
                2400);
            return;
        }

        var values = ShowDialog(new DialogOptions
        {
            Title = "Repair open paths",
            Description =
                $"{open.Count} open path{(open.Count == 1 ? string.Empty : "s")} " +
                $"{(selection.Count > 0 ? "in the selection" : "in the drawing")}. " +
                "Close adds a line across each path's own gap; join merges free ends of different paths that meet.",
            Fields = new[]
            {
                new DialogField
                {
                    Key = "tolerance",
                    Label = "Max gap",
                    Type = FieldType.Number,
                    Value = Math.Round(ToDisplay(0.2), 4),
                    Min = 0,
                    Step = 0.05,
                    Suffix = UnitLabel(),
                },
                new DialogField
                {
                    Key = "close",
                    Label = "Close each path's own gap",
                    Type = FieldType.Checkbox,
                    Value = true,
                },
                new DialogField
                {
                    Key = "join",
                    Label = "Join ends between paths",
                    Type = FieldType.Checkbox,
                    Value = true,
                },
            },
            SubmitLabel = "Repair",
            Validate = v =>
            {
                var tolerance = Number(v, "tolerance");
                if (!double.IsFinite(tolerance) || tolerance < 0) return "Max gap must be zero or more.";
                if (!Bool(v, "close") && !Bool(v, "join")) return "Choose at least one repair action.";
                return null;
            },
        });
        if (values is null) return;

        RepairOpenPaths(
            open,
            FromDisplay(Number(values, "tolerance")),
            Bool(values, "close"),
            Bool(values, "join"));
    }

    private void RepairOpenPaths(List<Path> targets, double tolerance, bool closeGaps, bool joinEnds)
    {
        PushUndo();
        var closedCount = 0;
        var joinCount = 0;

        if (closeGaps)
        {
            foreach (var path in targets)
            {
                if (Geom.ClosePathGap(path, tolerance)) closedCount++;
            }
        }

        if (joinEnds)
        {
            var result = Geom.JoinOpenPaths(targets, tolerance);
            joinCount = result.Joins;
            if (result.Absorbed.Count > 0)
            {
                foreach (var (absorbedPath, owner) in result.Absorbed)
                {
                    if (absorbedPath.Id is not null && Selection.Contains(absorbedPath.Id))
                    {
                        Selection.Remove(absorbedPath.Id);
                        if (owner.Id is not null) Selection.Add(owner.Id);
                    }
                    if (absorbedPath.Id is null || owner.Id is null || absorbedPath.Id == owner.Id) continue;
                    if (_nestBoundaryId == absorbedPath.Id) _nestBoundaryId = owner.Id;

                    // Operations that referenced the absorbed path now use its owner.
                    foreach (var op in Operations)
                    {
                        if (!op.PathIds.Contains(absorbedPath.Id)) continue;
                        op.PathIds = op.PathIds
                            .Select(id => id == absorbedPath.Id ? owner.Id : id)
                            .Distinct()
                            .ToList();
                    }
                }

                var absorbed = new HashSet<Path>(result.Absorbed.Keys);
                Paths = Paths.Where(p => !absorbed.Contains(p)).ToList();
                var survivingIds = Paths.Where(p => p.Id is not null).Select(p => p.Id!).ToHashSet();
                Selection.RemoveWhere(id => !survivingIds.Contains(id));
            }
        }

        RegenerateAll(true);
        UpdateSelectionUI();
        RequestRender();

        if (closedCount == 0 && joinCount == 0)
        {
            _window.ShowToast("No open ends were within the maximum gap.", "warning", 4000);
            return;
        }

        var parts = new List<string>();
        if (closedCount > 0) parts.Add($"{closedCount} gap{(closedCount == 1 ? string.Empty : "s")} closed");
        if (joinCount > 0) parts.Add($"{joinCount} join{(joinCount == 1 ? string.Empty : "s")} made");
        _window.ShowToast($"Repaired open paths: {string.Join(", ", parts)}.", "success", 3200);
    }

    /* ------------------------------------------------------------------ */
    /* File operations                                                     */
    /* ------------------------------------------------------------------ */

    private Dictionary<string, object?>? ShowDialog(DialogOptions options) =>
        DialogService.Show(_window, options);

    private void ImportSvg()
    {
        var dialog = new OpenFileDialog
        {
            Title = "Open SVG or MakerCam project",
            Filter = "SVG / MakerCam project (*.svg)|*.svg|All files (*.*)|*.*",
        };
        if (dialog.ShowDialog(_window) != true) return;
        ReadFile(dialog.FileName);
    }

    private void ReadFile(string filename)
    {
        try
        {
            var text = System.IO.File.ReadAllText(filename);
            ImportText(text, System.IO.Path.GetFileName(filename), false, filename);
        }
        catch (Exception ex)
        {
            DialogService.Error(_window, "Could not read the file", ex.Message);
        }
    }

    /// <summary>Opens a file dropped onto the window or passed on the command line.</summary>
    public void OpenExternalFile(string filename)
    {
        if (!System.IO.File.Exists(filename))
        {
            _window.ShowToast("The dropped file could not be found", "error", 3000);
            return;
        }
        ReadFile(filename);
    }

    private void UpdateRecentFilesMenu()
    {
        // Do not offer files that have been moved or deleted.
        _recentFiles.RemoveAll(path => !System.IO.File.Exists(path));
        _window.SetRecentFiles(_recentFiles);
    }

    private void AddRecentFile(string path)
    {
        try { path = System.IO.Path.GetFullPath(path); }
        catch { return; }

        _recentFiles.RemoveAll(existing =>
            string.Equals(existing, path, StringComparison.OrdinalIgnoreCase));
        _recentFiles.Insert(0, path);
        if (_recentFiles.Count > RecentFilesLimit)
        {
            _recentFiles.RemoveRange(RecentFilesLimit, _recentFiles.Count - RecentFilesLimit);
        }

        SavePrefs();
        UpdateRecentFilesMenu();
    }

    public void ClearRecentFiles()
    {
        _recentFiles.Clear();
        SavePrefs();
        UpdateRecentFilesMenu();
    }

    private void ImportText(string text, string filename, bool replace = false, string? fullPath = null)
    {
        try
        {
            var project = ProjectIO.ParseProject(text, new SvgImportOptions { PxPerInch = PxPerInch });
            if (project is not null)
            {
                if (!ConfirmDiscard("opening this project")) return;
                LoadProject(project, filename);
                _documentName = filename;
                UpdateTitle();
                AddRecentFile(fullPath ?? filename);
                return;
            }

            var imported = SvgImporter.ParseSvg(text, new SvgImportOptions { PxPerInch = PxPerInch });
            if (imported.Paths.Count == 0)
            {
                DialogService.Error(
                    _window,
                    "Nothing to import",
                    imported.Warnings.Count > 0
                        ? string.Join("\n", imported.Warnings)
                        : "No supported geometry was found.");
                return;
            }

            var startingFresh = replace || Paths.Count == 0;
            PushUndo();
            if (replace)
            {
                Paths = new List<Path>();
                Operations = new List<Operation>();
                Selection.Clear();
                SelectedOperationId = null;
                _nextPathId = 1;
                _nextOperationId = 1;
            }

            foreach (var path in imported.Paths)
            {
                path.Id = NewPathId();
                Paths.Add(path);
            }

            if (startingFresh)
            {
                _pageWidthMm = imported.WidthMm > 0 ? imported.WidthMm : null;
                _pageHeightMm = imported.HeightMm > 0 ? imported.HeightMm : null;
            }

            _documentName = filename;
            Selection.Clear();
            SelectedOperationId = null;
            _flattenCache.Clear();
            UpdateSelectionUI();
            UpdateEmptyState();
            UpdateTitle();
            Fit();
            _window.ShowToast(
                $"Imported {imported.Paths.Count} path{(imported.Paths.Count == 1 ? string.Empty : "s")} from {filename}",
                "success",
                3500);
            if (imported.Warnings.Count > 0)
            {
                _window.ShowToast(string.Join(" ", imported.Warnings.Take(3)), "warning", 7000);
            }
            AddRecentFile(fullPath ?? filename);
        }
        catch (Exception ex)
        {
            DialogService.Error(_window, "Could not import SVG", ex.Message);
        }
    }

    private void LoadProject(ProjectData project, string filename)
    {
        PushUndo();
        _pageWidthMm = project.WidthMm > 0 ? project.WidthMm : null;
        _pageHeightMm = project.HeightMm > 0 ? project.HeightMm : null;
        Paths = project.Paths;
        EnsurePathIds(Paths);
        _nextOperationId = 1;
        Operations = project.Operations.Select(def => new Operation
        {
            Id = string.IsNullOrEmpty(def.Id) ? NewOperationId() : def.Id!,
            Type = def.Type,
            Name = def.Name,
            Params = def.Params,
            PathIds = def.PathIds.ToList(),
            Loops = new List<Loop>(),
            DrillPoints = new List<Vec>(),
            Processed = false,
            Visible = true,
        }).ToList();

        Selection.Clear();
        SelectedOperationId = Operations.FirstOrDefault()?.Id;
        _flattenCache.Clear();
        RegenerateAll(true);
        UpdateSelectionUI();
        UpdateEmptyState();
        RenderOperations();
        Fit();
        _window.ShowToast(
            $"Opened {filename}: {Paths.Count} paths, {Operations.Count} operations",
            "success",
            4000);
        if (project.Warnings.Count > 0)
        {
            _window.ShowToast(string.Join(" ", project.Warnings.Take(3)), "warning", 7000);
        }
        MarkClean();
    }

    private bool SaveProject()
    {
        if (Paths.Count == 0)
        {
            _window.ShowToast("There is nothing to save yet", "info", 2200);
            return false;
        }

        var dialog = new SaveFileDialog
        {
            Title = "Save project",
            FileName = "makercam-project.svg",
            DefaultExt = ".svg",
            Filter = "SVG project (*.svg)|*.svg",
        };
        if (dialog.ShowDialog(_window) != true) return false;

        try
        {
            var defs = Operations.Select(op => new OpDefinition
            {
                Id = op.Id,
                Type = op.Type,
                Name = op.Name,
                Params = op.Params,
                PathIds = op.PathIds.ToList(),
            }).ToList();
            var svg = ProjectIO.SerializeProject(Paths, defs, DisplayUnit, _pageWidthMm, _pageHeightMm);
            System.IO.File.WriteAllText(dialog.FileName, svg, new UTF8Encoding(false));
            _documentName = System.IO.Path.GetFileName(dialog.FileName);
            MarkClean();
            _window.ShowToast("Project saved (SVG + CAM metadata)", "success", 2600);
            return true;
        }
        catch (Exception ex)
        {
            DialogService.Error(_window, "Could not save the project", ex.Message);
            return false;
        }
    }

    private void ExportGcodeDialog()
    {
        var processed = Operations.Where(o => o.Processed).ToList();
        if (processed.Count == 0)
        {
            _window.ShowToast("Create and generate at least one toolpath first", "warning", 3000);
            return;
        }

        var fields = new List<DialogField>
        {
            new()
            {
                Key = "unit",
                Label = "Output units",
                Type = FieldType.Select,
                Value = Units.ToCode(DisplayUnit),
                Options = new[]
                {
                    new FieldOption("Millimetres (G21)", "mm"),
                    new FieldOption("Inches (G20)", "in"),
                },
            },
            new() { Key = "sep", Type = FieldType.Label, Wide = true, Label = "Toolpaths to export:" },
        };

        foreach (var op in processed)
        {
            fields.Add(new DialogField
            {
                Key = $"op_{op.Id}",
                Label = $"{op.Name} — {TypeLabel[op.Type]}, Ø {FmtLen(op.Params.ToolDiameter)} {UnitLabel()}",
                Type = FieldType.Checkbox,
                Value = true,
                Wide = true,
            });
        }

        var values = ShowDialog(new DialogOptions
        {
            Title = "Export G-code",
            Description = "Only generated toolpaths are listed. Output is GRBL-compatible: tool changes pause with M0 for a manual cutter change.",
            Fields = fields,
            SubmitLabel = "Save .nc",
            Wide = true,
            Validate = v => processed.Any(op => Bool(v, $"op_{op.Id}"))
                ? null
                : "Select at least one toolpath.",
        });
        if (values is null) return;

        var selected = processed.Where(op => Bool(values, $"op_{op.Id}")).ToList();
        var outputUnit = values.GetValueOrDefault("unit")?.ToString() == "in" ? Unit.In : Unit.Mm;
        var gcode = GcodeGenerator.Generate(selected, outputUnit, Tolerance);
        if (string.IsNullOrEmpty(gcode))
        {
            _window.ShowToast("The selected toolpaths produced no G-code", "error", 3200);
            return;
        }

        var dialog = new SaveFileDialog
        {
            Title = "Export G-code",
            FileName = "part.nc",
            DefaultExt = ".nc",
            Filter = "G-code (*.nc)|*.nc|Text files (*.txt)|*.txt|All files (*.*)|*.*",
        };
        if (dialog.ShowDialog(_window) != true) return;

        try
        {
            System.IO.File.WriteAllText(dialog.FileName, gcode, new UTF8Encoding(false));
            var estimate = selected.Sum(GcodeGenerator.EstimateTime);
            _window.ShowToast(
                $"G-code exported: {selected.Count} toolpath{(selected.Count == 1 ? string.Empty : "s")}, " +
                $"~{Math.Max(1, Math.Round(estimate))} min",
                "success",
                4000);
        }
        catch (Exception ex)
        {
            DialogService.Error(_window, "Could not save the G-code", ex.Message);
        }
    }

    /* ------------------------------------------------------------------ */
    /* Nesting                                                             */
    /* ------------------------------------------------------------------ */

    private void SetNestBoundary()
    {
        var selected = SelectedPaths().Where(p => Geom.IsClosedPath(p)).ToList();
        if (selected.Count != 1)
        {
            _window.ShowToast("Select exactly one closed path to use as the material boundary", "warning", 3500);
            return;
        }
        _nestBoundaryId = selected[0].Id;
        UpdateHint($"Material boundary: {selected[0].Name ?? "path"}");
        _window.ShowToast("Material boundary set", "success", 2200);
    }

    private void RunNestDialog()
    {
        var boundary = Paths.FirstOrDefault(p => p.Id == _nestBoundaryId);
        if (boundary is null || !Geom.IsClosedPath(boundary))
        {
            _window.ShowToast("Set a closed material boundary first (Nesting → Set material boundary)", "warning", 4200);
            return;
        }

        var ops = Operations
            .Where(o => o.Processed && o.PathIds.Count > 0 && !o.PathIds.Contains(_nestBoundaryId!))
            .ToList();
        if (ops.Count < 2)
        {
            _window.ShowToast("At least two generated toolpaths are required for nesting", "warning", 3500);
            return;
        }

        var u = UnitLabel();
        var values = ShowDialog(new DialogOptions
        {
            Title = "Nest toolpaths",
            Description = "Pack the generated toolpaths inside the boundary, trying several rotations.",
            Fields = new[]
            {
                new DialogField { Key = "gap", Label = "Space between objects", Type = FieldType.Number, Value = Math.Round(ToDisplay(3), 3, MidpointRounding.AwayFromZero), Min = 0, Step = 0.5, Suffix = u },
                new DialogField
                {
                    Key = "rotations",
                    Label = "Rotations to try",
                    Type = FieldType.Select,
                    Value = 8,
                    Options = new[]
                    {
                        new FieldOption("4 (0°, 90°, 180°, 270°)", 4),
                        new FieldOption("8 (45° steps)", 8),
                        new FieldOption("12 (30° steps)", 12),
                        new FieldOption("16 (22.5° steps)", 16),
                    },
                },
            },
            SubmitLabel = "Nest",
        });
        if (values is null) return;

        var gap = FromDisplay(Number(values, "gap", 0));
        var rotations = Number(values, "rotations", 8);
        RunNest(boundary, ops, gap, (int)rotations);
    }

    private void RunNest(Path boundary, List<Operation> ops, double gap, int rotationCount)
    {
        var boundaryPoints = Geom.ClosedPolygon(boundary, 0.1);
        if (boundaryPoints.Count < 3)
        {
            _window.ShowToast("The boundary path is invalid", "error", 3000);
            return;
        }

        var items = new List<NestItem>();
        foreach (var op in ops)
        {
            var points = new List<Vec>();
            foreach (var path in PathsForOperation(op))
            {
                points.AddRange(Geom.FlattenPath(path, 0.3));
                foreach (var segment in path.Segments)
                {
                    if (segment is CubicSegment cubic) points.Add(cubic.C1);
                    if (segment is CubicSegment c2) points.Add(c2.C2);
                    if (segment is QuadSegment quad) points.Add(quad.C);
                }
            }

            if (points.Count < 3)
            {
                items.Add(new NestItem { Outline = new List<Vec>(), SourceLoops = op.Loops });
                continue;
            }

            var hull = ConvexHull(points);
            var buffer = op.Params.ToolDiameter / 2 + gap / 2;
            if (buffer > 0 && hull.Count >= 3)
            {
                var buffered = CamEngine.OffsetRegion(new[]
                {
                    new Loop
                    {
                        Points = hull,
                        Depth = 0,
                        Closed = true,
                        PocketDepth = 0,
                        Tabs = new List<Tab>(),
                    },
                }, buffer);
                if (buffered.Count > 0)
                {
                    var outer = buffered
                        .Where(l => l.Depth % 2 == 0)
                        .OrderByDescending(l => Math.Abs(Geom.PolygonArea(l.Points)))
                        .FirstOrDefault();
                    if (outer is not null) hull = outer.Points;
                }
            }

            items.Add(new NestItem { Outline = hull, SourceLoops = op.Loops });
        }

        var bounds = Geom.PolygonBounds(boundaryPoints);
        var step = Math.Max(1, Math.Min(10,
            Math.Max(bounds.MaxX - bounds.MinX, bounds.MaxY - bounds.MinY) / 120));
        var rotations = Enumerable.Range(0, rotationCount)
            .Select(i => i * 2 * Math.PI / rotationCount)
            .ToList();

        List<NestPlacement> placements;
        try
        {
            placements = CamEngine.NestItems(
                boundaryPoints,
                items,
                new NestOptions { Gap = gap, Rotations = rotations, Step = step });
        }
        catch (Exception ex)
        {
            DialogService.Error(_window, "Nesting failed", ex.Message);
            return;
        }

        if (placements.Count == 0)
        {
            _window.ShowToast("None of the objects fit inside the boundary", "warning", 4200);
            return;
        }

        PushUndo();
        var applied = new HashSet<string>();
        foreach (var placement in placements)
        {
            if (placement.Index < 0 || placement.Index >= ops.Count) continue;
            var op = ops[placement.Index];
            var m = Geom.MatrixMultiply(
                Geom.MatrixTranslate(placement.Position.X, placement.Position.Y),
                Geom.MatrixRotate(placement.Rotation));
            foreach (var path in PathsForOperation(op))
            {
                if (path.Id is null || applied.Contains(path.Id)) continue;
                var index = Paths.FindIndex(p => p.Id == path.Id);
                if (index < 0) continue;
                Paths[index] = Geom.TransformPath(Paths[index], m);
                applied.Add(path.Id);
            }
        }

        _flattenCache.Clear();
        RegenerateAll(true);
        UpdateSelectionUI();
        RequestRender();
        _window.ShowToast(
            $"Nested {placements.Count} of {ops.Count} operations ({applied.Count} paths moved)",
            placements.Count < ops.Count ? "warning" : "success",
            5000);
    }

    private static List<Vec> ConvexHull(List<Vec> points)
    {
        if (points.Count <= 3) return points.ToList();
        var pts = points
            .OrderBy(p => p.X)
            .ThenBy(p => p.Y)
            .ToList();

        static double Cross(Vec o, Vec a, Vec b) =>
            (a.X - o.X) * (b.Y - o.Y) - (a.Y - o.Y) * (b.X - o.X);

        var lower = new List<Vec>();
        foreach (var p in pts)
        {
            while (lower.Count >= 2 && Cross(lower[^2], lower[^1], p) <= 0) lower.RemoveAt(lower.Count - 1);
            lower.Add(p);
        }
        var upper = new List<Vec>();
        for (var i = pts.Count - 1; i >= 0; i--)
        {
            var p = pts[i];
            while (upper.Count >= 2 && Cross(upper[^2], upper[^1], p) <= 0) upper.RemoveAt(upper.Count - 1);
            upper.Add(p);
        }
        lower.RemoveAt(lower.Count - 1);
        upper.RemoveAt(upper.Count - 1);
        lower.AddRange(upper);
        return lower;
    }

    /* ------------------------------------------------------------------ */
    /* Example project                                                     */
    /* ------------------------------------------------------------------ */

    private void LoadExample()
    {
        try
        {
            if (!ConfirmDiscard("loading the example")) return;

            var imported = SvgImporter.ParseSvg(SampleProject.ExampleSvg, new SvgImportOptions { PxPerInch = PxPerInch });
            if (imported.Paths.Count == 0)
            {
                DialogService.Error(_window, "Could not load the example", "The bundled example SVG produced no geometry.");
                return;
            }

            PushUndo();
            _pageWidthMm = imported.WidthMm > 0 ? imported.WidthMm : null;
            _pageHeightMm = imported.HeightMm > 0 ? imported.HeightMm : null;
            Paths = new List<Path>();
            Operations = new List<Operation>();
            Selection.Clear();
            SelectedOperationId = null;
            _nextPathId = 1;
            _nextOperationId = 1;
            _nestBoundaryId = null;

            foreach (var path in imported.Paths)
            {
                path.Id = NewPathId();
                Paths.Add(path);
            }

            var bySource = Paths
                .Where(p => !string.IsNullOrEmpty(p.SourceId))
                .GroupBy(p => p.SourceId!)
                .ToDictionary(g => g.Key, g => g.First());

            var baseParams = OperationParams.Defaults(Unit.Mm);

            Operation Add(OperationType type, string name, OperationParams parameters, List<Path> paths)
            {
                var op = new Operation
                {
                    Id = NewOperationId(),
                    Type = type,
                    Name = name,
                    Params = parameters,
                    PathIds = paths.Where(p => p.Id is not null).Select(p => p.Id!).ToList(),
                    Loops = new List<Loop>(),
                    DrillPoints = new List<Vec>(),
                    Processed = false,
                    Visible = true,
                };
                RegenerateOperation(op);
                Operations.Add(op);
                return op;
            }

            OperationParams With(Action<OperationParams> configure)
            {
                var p = baseParams.Clone();
                configure(p);
                return p;
            }

            // Machining order: drill the holes, clear the pocket, then cut the
            // outside profile last so the part stays attached until the end.
            var holes = new[] { "hole1", "hole2" }
                .Where(bySource.ContainsKey)
                .Select(id => bySource[id])
                .ToList();
            if (holes.Count > 0)
            {
                Add(OperationType.Drill, "Bolt holes", With(p =>
                {
                    p.ToolDiameter = 5;
                    p.TargetDepth = -8;
                    p.SafetyHeight = 12;
                    p.StockSurface = 0;
                    p.Stepdown = 2;
                    p.Feedrate = 300;
                    p.PlungeRate = 250;
                    p.Center = true;
                }), holes);
            }

            if (bySource.TryGetValue("pocket", out var pocket))
            {
                Add(OperationType.Pocket, "Inner pocket", With(p =>
                {
                    p.ToolDiameter = 6.35;
                    p.TargetDepth = -4;
                    p.SafetyHeight = 12;
                    p.StockSurface = 0;
                    p.Stepdown = 2;
                    p.Stepover = 0.4;
                    p.RoughingClearance = 0;
                    p.Feedrate = 800;
                    p.PlungeRate = 300;
                    p.Direction = Direction.CounterClockwise;
                }), new List<Path> { pocket });
            }

            if (bySource.TryGetValue("outline", out var outline))
            {
                Add(OperationType.Profile, "Plate outline", With(p =>
                {
                    p.ToolDiameter = 6.35;
                    p.TargetDepth = -6;
                    p.SafetyHeight = 12;
                    p.StockSurface = 0;
                    p.Stepdown = 2;
                    p.Feedrate = 900;
                    p.PlungeRate = 300;
                    p.Outside = true;
                    p.Direction = Direction.CounterClockwise;
                    p.TabSpacing = 60;
                    p.TabWidth = 6;
                    p.TabHeight = 3;
                }), new List<Path> { outline });
            }

            SelectedOperationId = Operations.LastOrDefault()?.Id;
            _flattenCache.Clear();
            RegenerateAll(true);
            UpdateSelectionUI();
            UpdateEmptyState();
            Fit();
            _window.ShowToast("Example loaded: drill, pocket and profile", "success", 4000);
            if (imported.Warnings.Count > 0)
            {
                _window.ShowToast(string.Join(" ", imported.Warnings.Take(2)), "warning", 5000);
            }
            _documentName = null;
            MarkClean();
        }
        catch (Exception ex)
        {
            DialogService.Error(_window, "Could not load the example", ex.Message);
        }
    }

    /* ------------------------------------------------------------------ */
    /* Preferences and help                                                */
    /* ------------------------------------------------------------------ */

    private void PreferencesDialog()
    {
        var values = ShowDialog(new DialogOptions
        {
            Title = "Preferences",
            Fields = new[]
            {
                new DialogField
                {
                    Key = "pxPerInch",
                    Label = "SVG import resolution",
                    Type = FieldType.Number,
                    Value = PxPerInch,
                    Min = 1,
                    Step = 1,
                    Suffix = "px/in",
                    Help = "Illustrator/Flash commonly use 72; Inkscape and CSS use 90/96.",
                },
                new DialogField
                {
                    Key = "tolerance",
                    Label = "CAM curve tolerance",
                    Type = FieldType.Number,
                    Value = Tolerance,
                    Min = 0.001,
                    Step = 0.001,
                    Suffix = "mm",
                    Help = "Smaller values produce smoother curves and more G-code.",
                },
                new DialogField { Key = "grid", Label = "Show grid", Type = FieldType.Checkbox, Value = ShowGrid },
                new DialogField { Key = "snap", Label = "Snap to grid", Type = FieldType.Checkbox, Value = ShowSnap },
                new DialogField { Key = "showToolpaths", Label = "Show toolpaths", Type = FieldType.Checkbox, Value = ShowToolpaths },
                new DialogField { Key = "showToolDiameter", Label = "Show cutter diameter", Type = FieldType.Checkbox, Value = ShowToolDiameter },
            },
            SubmitLabel = "Save",
            Validate = v =>
            {
                if (!(Number(v, "pxPerInch") > 0)) return "Import resolution must be greater than zero.";
                if (!(Number(v, "tolerance") > 0)) return "Tolerance must be greater than zero.";
                return null;
            },
        });
        if (values is null) return;

        PxPerInch = Number(values, "pxPerInch");
        Tolerance = Number(values, "tolerance");
        ShowGrid = Bool(values, "grid");
        ShowSnap = Bool(values, "snap");
        ShowToolpaths = Bool(values, "showToolpaths");
        ShowToolDiameter = Bool(values, "showToolDiameter");
        SavePrefs();
        _window.SetToggleStates(ShowGrid, ShowSnap, ShowToolpaths, ShowToolDiameter);
        RegenerateAll(true);
        RequestRender();
        _window.ShowToast("Preferences saved", "success", 2000);
    }

    private void QuickGuide()
    {
        ShowDialog(new DialogOptions
        {
            Title = "Quick guide",
            Description = "The same workflow as the original MakerCam, in a native Windows app.",
            Fields = new[]
            {
                new DialogField { Key = "a", Type = FieldType.Label, Wide = true, Label = "1. Import an SVG with File → Import SVG, or insert a shape from the Insert menu." },
                new DialogField { Key = "b", Type = FieldType.Label, Wide = true, Label = "2. Use Select (V) to click paths, Shift-click to add, and drag to move. Scroll to zoom; hold Space to pan." },
                new DialogField { Key = "c", Type = FieldType.Label, Wide = true, Label = "3. Choose CAM → Profile, Pocket, Follow path, Drill or Holes along path. Closed paths are required for profile/pocket/drill." },
                new DialogField { Key = "d", Type = FieldType.Label, Wide = true, Label = "4. Inspect the green/orange toolpaths. Select an operation in the sidebar to edit or delete it." },
                new DialogField { Key = "e", Type = FieldType.Label, Wide = true, Label = "5. Export G-code from the Toolpaths menu or the sidebar button. Save the project as SVG to keep operations." },
                new DialogField { Key = "f", Type = FieldType.Label, Wide = true, Label = "Tip: CAM → Add tabs leaves bridges on profile cuts. Use Show cutter diameter to preview the material removal." },
            },
            SubmitLabel = "Got it",
        });
    }

    private void About()
    {
        ShowDialog(new DialogOptions
        {
            Title = $"About {AppName}",
            Description =
                "A native C#/WPF port of PartKam / MakerCam, the browser-based 2.5D CAM tool " +
                "written in ActionScript 3 by Jack Clark circa 2010. The original is LGPL-3.0; " +
                "this port is derived from its source and is distributed under the same license.",
            Fields = new[]
            {
                new DialogField { Key = "a", Type = FieldType.Label, Wide = true, Label = "Features: SVG import, interactive editing, profile/pocket/follow/drill/holes-along-path toolpaths, tabs, nesting, and G-code export." },
                new DialogField { Key = "b", Type = FieldType.Label, Wide = true, Label = "Geometry is processed in millimetres. G-code can be written in millimetres (G21) or inches (G20)." },
                new DialogField { Key = "c", Type = FieldType.Label, Wide = true, Label = "Always verify toolpaths and G-code before running a machine." },
            },
            SubmitLabel = "Close",
        });
    }

    /* ------------------------------------------------------------------ */
    /* Commands                                                            */
    /* ------------------------------------------------------------------ */

    public void HandleCommand(string command)
    {
        switch (command)
        {
            case "file-import":
            case "file-open-project":
                ImportSvg();
                break;
            case "file-save":
                SaveProject();
                break;
            case "file-export":
            case "toolpaths-export":
                ExportGcodeDialog();
                break;
            case "file-new":
                if (IsDirty)
                {
                    if (!ConfirmDiscard("starting a new project")) break;
                }
                else if (!DialogService.Confirm(_window, "Start a new project?", "New project"))
                {
                    break;
                }

                PushUndo();
                Paths = new List<Path>();
                Operations = new List<Operation>();
                Selection.Clear();
                SelectedOperationId = null;
                _nextPathId = 1;
                _nextOperationId = 1;
                _nestBoundaryId = null;
                _flattenCache.Clear();
                _emptyStateDismissed = false;
                _pageWidthMm = null;
                _pageHeightMm = null;
                _documentName = null;
                MarkClean();
                UpdateSelectionUI();
                UpdateEmptyState();
                Fit();
                break;

            case "edit-undo":
                Undo();
                break;
            case "edit-redo":
                Redo();
                break;
            case "edit-selectall":
                SelectAll();
                break;
            case "edit-copy":
                CopySelection();
                break;
            case "edit-paste":
                PasteSelection();
                break;
            case "edit-delete":
                DeleteSelection();
                break;
            case "edit-scale":
                ScaleDialog();
                break;
            case "edit-rotate":
                RotateDialog();
                break;
            case "edit-skew":
                SkewDialog();
                break;
            case "edit-repair-open":
                RepairOpenPathsDialog();
                break;
            case "edit-preferences":
                PreferencesDialog();
                break;

            case "insert-shape":
                InsertShapeDialog();
                break;
            case "insert-circle":
                InsertShape("circle");
                break;
            case "insert-ellipse":
                InsertShape("ellipse");
                break;
            case "insert-rectangle":
                InsertShape("rectangle");
                break;
            case "insert-roundedrect":
                InsertShape("roundedrect");
                break;
            case "insert-polygon":
                InsertShape("polygon");
                break;
            case "insert-star":
                InsertShape("star");
                break;

            case "add-op":
                AddOperationDialog();
                break;
            case "cam-profile":
                CreateOperation(OperationType.Profile);
                break;
            case "cam-pocket":
                CreateOperation(OperationType.Pocket);
                break;
            case "cam-follow":
                CreateOperation(OperationType.Follow);
                break;
            case "cam-drill":
                CreateOperation(OperationType.Drill);
                break;
            case "cam-drillpath":
                CreateOperation(OperationType.DrillPath);
                break;
            case "cam-tabs":
                AddTabsDialog();
                break;
            case "cam-regenerate":
                PushUndo();
                RegenerateAll();
                _window.ShowToast("Toolpaths regenerated", "success", 2200);
                break;
            case "cam-delete":
            {
                var op = Operations.FirstOrDefault(o => o.Id == SelectedOperationId);
                if (op is not null)
                {
                    if (DialogService.Confirm(_window, $"Delete \"{op.Name}\"?", "Delete operation"))
                    {
                        DeleteOperation(op);
                    }
                }
                else
                {
                    _window.ShowToast("Select an operation in the sidebar first", "info", 2200);
                }
                break;
            }

            case "toolpaths-toggle":
                ToggleToolpaths();
                break;
            case "toolpaths-diameter":
                ToggleToolDiameter();
                break;
            case "toolpaths-refit":
                Fit();
                break;

            case "nest-boundary":
                SetNestBoundary();
                break;
            case "nest-run":
                RunNestDialog();
                break;

            case "help-example":
                LoadExample();
                break;
            case "help-guide":
                QuickGuide();
                break;
            case "help-about":
                About();
                break;

            case "tool-select":
                SetTool(Tool.Select);
                break;
            case "tool-pan":
                SetTool(Tool.Pan);
                break;
            case "tool-pen":
                SetTool(Tool.Pen);
                break;
            case "view-fit":
                Fit();
                break;
            case "view-zoomin":
                ZoomAtCenter(1.2);
                break;
            case "view-zoomout":
                ZoomAtCenter(1 / 1.2);
                break;
            case "toggle-grid":
                ToggleGrid();
                break;
            case "toggle-snap":
                ToggleSnap();
                break;
            case "toggle-toolpaths":
                ToggleToolpaths();
                break;
            case "toggle-diameter":
                ToggleToolDiameter();
                break;
            case "toggle-panel":
                _sidebarVisible = !_sidebarVisible;
                _window.SetSidebarVisible(_sidebarVisible);
                break;
        }
    }

    /* ------------------------------------------------------------------ */
    /* Keyboard                                                            */
    /* ------------------------------------------------------------------ */

    private void OnKeyDown(object sender, KeyEventArgs e)
    {
        if (Keyboard.FocusedElement is TextBoxBase or ComboBox) return;

        var ctrl = (Keyboard.Modifiers & ModifierKeys.Control) != 0;

        if (e.Key == Key.Space)
        {
            if (!_spaceDown)
            {
                _spaceDown = true;
                UpdateCursor();
            }
            e.Handled = true;
            return;
        }

        if (ctrl && e.Key == Key.Z && !(Keyboard.Modifiers.HasFlag(ModifierKeys.Shift)))
        {
            Undo();
            e.Handled = true;
            return;
        }
        if (ctrl && (e.Key == Key.Y || (e.Key == Key.Z && Keyboard.Modifiers.HasFlag(ModifierKeys.Shift))))
        {
            Redo();
            e.Handled = true;
            return;
        }
        if (ctrl && e.Key == Key.A)
        {
            SelectAll();
            e.Handled = true;
            return;
        }
        if (ctrl && e.Key == Key.C)
        {
            CopySelection();
            e.Handled = true;
            return;
        }
        if (ctrl && e.Key == Key.V)
        {
            PasteSelection();
            e.Handled = true;
            return;
        }
        if (ctrl && e.Key == Key.S)
        {
            SaveProject();
            e.Handled = true;
            return;
        }
        if (ctrl && e.Key == Key.E)
        {
            ExportGcodeDialog();
            e.Handled = true;
            return;
        }
        if (ctrl && e.Key == Key.O)
        {
            ImportSvg();
            e.Handled = true;
            return;
        }

        if (e.Key is Key.Delete or Key.Back)
        {
            DeleteSelection();
            e.Handled = true;
            return;
        }

        if (e.Key == Key.Escape)
        {
            if (Paths.Count == 0 && !_emptyStateDismissed)
            {
                _emptyStateDismissed = true;
                UpdateEmptyState();
                UpdateHint("Ready. Drag an SVG onto the window or use File → Import SVG.");
                return;
            }

            if (_penPoints.Count > 0) CancelPen();
            else if (_dragKind != DragKind.None) EndDrag();
            return;
        }

        if (e.Key == Key.Enter && CurrentTool == Tool.Pen)
        {
            FinishPen(false);
            e.Handled = true;
            return;
        }

        if (!ctrl)
        {
            switch (e.Key)
            {
                case Key.V:
                    SetTool(Tool.Select);
                    break;
                case Key.H:
                    SetTool(Tool.Pan);
                    break;
                case Key.P:
                    SetTool(Tool.Pen);
                    break;
                case Key.F:
                    Fit();
                    break;
                case Key.G:
                    ToggleGrid();
                    break;
                case Key.OemPlus:
                case Key.Add:
                    ZoomAtCenter(1.2);
                    break;
                case Key.OemMinus:
                case Key.Subtract:
                    ZoomAtCenter(1 / 1.2);
                    break;
            }
        }
    }

    private void OnKeyUp(object sender, KeyEventArgs e)
    {
        if (e.Key == Key.Space)
        {
            _spaceDown = false;
            UpdateCursor();
        }
    }
}
