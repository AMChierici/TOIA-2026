defmodule Toia.Repo.Migrations.AddStreamLanguageAndBio do
  use Ecto.Migration

  def change do
    alter table(:stream) do
      add :language, :string, default: "en-US"
      add :bio, :text
    end
  end
end
