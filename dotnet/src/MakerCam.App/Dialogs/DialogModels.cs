namespace MakerCam.App;

public enum FieldType
{
    Text,
    Number,
    Select,
    Checkbox,
    Label,
    Password,
}

public sealed class FieldOption
{
    public FieldOption(string label, object value)
    {
        Label = label;
        Value = value;
    }

    public string Label { get; }
    public object Value { get; }
}

public sealed class DialogField
{
    public string Key { get; init; } = string.Empty;
    public string? Label { get; init; }
    public FieldType Type { get; init; } = FieldType.Text;
    public object? Value { get; init; }
    public IReadOnlyList<FieldOption>? Options { get; init; }
    public double? Min { get; init; }
    public double? Max { get; init; }
    public double? Step { get; init; }
    public string? Suffix { get; init; }
    public string? Placeholder { get; init; }
    public string? Help { get; init; }
    public bool Disabled { get; init; }
    public bool Wide { get; init; }
}

public sealed class DialogOptions
{
    public string Title { get; init; } = string.Empty;
    public string? Description { get; init; }
    public IReadOnlyList<DialogField> Fields { get; init; } = Array.Empty<DialogField>();
    public string SubmitLabel { get; init; } = "OK";
    public string CancelLabel { get; init; } = "Cancel";
    public bool Wide { get; init; }
    public Func<Dictionary<string, object?>, string?>? Validate { get; init; }
}
