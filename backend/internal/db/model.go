package db

// TagInfo represents the display data for a tag
type TagInfo struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Color string `json:"color"`
}
